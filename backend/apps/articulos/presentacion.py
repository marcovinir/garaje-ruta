"""Cómo se presenta un artículo hacia afuera: su ruta pública y su precio en dólares."""

from decimal import Decimal

from django.utils.text import slugify

from apps.actividad.models import TipoCambio

from .models import Articulo, TipoArticulo

SECCION = {TipoArticulo.AUTO: "autos", TipoArticulo.REPUESTO: "repuestos"}


def ruta_publica(articulo: Articulo) -> str:
    """/autos/toyota-corolla-2015-123: se busca por el id final, el texto solo es legible."""
    return f"/{SECCION[articulo.tipo]}/{slugify(articulo.titulo)}-{articulo.id}"


def id_de_ruta(texto: str) -> int | None:
    ultimo = texto.rsplit("-", 1)[-1]
    return int(ultimo) if ultimo.isdigit() else None


def precio_usd(colones: int, tipo: TipoCambio | None) -> int | None:
    """Precio aproximado en dólares, redondeado a la decena; None si no hay tipo de cambio."""
    if tipo is None or not tipo.venta:
        return None
    return int(round(Decimal(colones) / tipo.venta / 10)) * 10
