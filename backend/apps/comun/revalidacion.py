"""Avisa a Next qué páginas cacheadas debe regenerar (etiquetas de `revalidateTag`).

Contrato con el frontend (Plan 3, `app/api/revalidar/route.ts`):
POST {FRONTEND_URL}/api/revalidar · Authorization: Bearer {REVALIDACION_SECRETO}
cuerpo {"etiquetas": ["articulos", "articulo-12"]}.
Etiquetas: "articulos" (listados, inicio, sitemap), "articulo-{id}", "catalogos", "configuracion".
"""

import logging
from typing import ClassVar, Protocol

import requests
from django.conf import settings
from django.db import transaction
from django.utils.module_loading import import_string

logger = logging.getLogger(__name__)


class Revalidador(Protocol):
    def revalidar(self, etiquetas: list[str]) -> None: ...


class RevalidadorHttp:
    def revalidar(self, etiquetas: list[str]) -> None:
        secreto = settings.REVALIDACION_SECRETO
        if not secreto:
            return  # desarrollo local: Next corre sin caché persistente
        try:
            respuesta = requests.post(
                f"{settings.FRONTEND_URL}/api/revalidar",
                json={"etiquetas": etiquetas},
                headers={"Authorization": f"Bearer {secreto}"},
                timeout=5,
            )
            if respuesta.status_code >= 400:
                logger.warning("Revalidación rechazada (%s): %s", respuesta.status_code, etiquetas)
        except requests.RequestException:
            # El cambio ya se guardó: Next se pondrá al día con su revalidate de respaldo.
            logger.warning("No se pudo revalidar %s", etiquetas, exc_info=True)


class RevalidadorMemoria:
    llamadas: ClassVar[list[list[str]]] = []

    def revalidar(self, etiquetas: list[str]) -> None:
        RevalidadorMemoria.llamadas.append(list(etiquetas))

    @classmethod
    def limpiar(cls) -> None:
        cls.llamadas.clear()


def revalidar_al_confirmar(*etiquetas: str) -> None:
    """Revalida solo si la transacción se confirma (una venta rechazada no avisa nada)."""
    unicas = list(dict.fromkeys(etiquetas))
    transaction.on_commit(lambda: import_string(settings.REVALIDADOR)().revalidar(unicas))


def revalidar_articulo(articulo_id: int) -> None:
    revalidar_al_confirmar("articulos", f"articulo-{articulo_id}")
