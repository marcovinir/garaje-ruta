"""Almacén de fotos: Cloudinary en serio y uno en memoria para las pruebas (§8).

Las fotos nunca pasan por Django (Vercel limita el cuerpo a 4,5 MB): el panel pide una firma,
sube directo a Cloudinary y luego guarda aquí los `public_id`.
"""

import time
from pathlib import Path
from typing import ClassVar, Protocol

from django.conf import settings
from django.utils.module_loading import import_string

PREFIJO_PROPIO = "garaje-ruta/articulos/"
PREFIJO_EJEMPLO = "garaje-ruta/ejemplo/"
CARPETA_SUBIDAS = "garaje-ruta/articulos"
MAX_FOTOS = 15


class AlmacenFotos(Protocol):
    def firmar_subida(self) -> dict: ...

    def borrar(self, public_ids: list[str]) -> None: ...

    def subir(self, ruta: Path, public_id: str) -> dict: ...


class AlmacenCloudinary:
    """Usa CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name)."""

    def __init__(self) -> None:
        import cloudinary

        self._config = cloudinary.config()

    def firmar_subida(self) -> dict:
        from cloudinary.utils import api_sign_request

        parametros = {"timestamp": int(time.time()), "folder": CARPETA_SUBIDAS}
        return {
            **parametros,
            "cloud_name": self._config.cloud_name,
            "api_key": self._config.api_key,
            "signature": api_sign_request(parametros, self._config.api_secret),
        }

    def borrar(self, public_ids: list[str]) -> None:
        import cloudinary.uploader

        for public_id in public_ids:
            cloudinary.uploader.destroy(public_id, invalidate=True)

    def subir(self, ruta: Path, public_id: str) -> dict:
        import cloudinary.uploader

        resultado = cloudinary.uploader.upload(
            str(ruta), public_id=public_id, overwrite=True, invalidate=True
        )
        return {
            "public_id": resultado["public_id"],
            "width": resultado["width"],
            "height": resultado["height"],
        }


class AlmacenFotosMemoria:
    """Doble de pruebas: recuerda lo subido y lo borrado."""

    subidas: ClassVar[list[str]] = []
    borradas: ClassVar[list[str]] = []

    def firmar_subida(self) -> dict:
        return {
            "cloud_name": "pruebas",
            "api_key": "123",
            "timestamp": 1_700_000_000,
            "folder": CARPETA_SUBIDAS,
            "signature": "firma-de-prueba",
        }

    def borrar(self, public_ids: list[str]) -> None:
        AlmacenFotosMemoria.borradas.extend(public_ids)

    def subir(self, ruta: Path, public_id: str) -> dict:
        from PIL import Image

        AlmacenFotosMemoria.subidas.append(public_id)
        with Image.open(ruta) as imagen:
            ancho, alto = imagen.size
        return {"public_id": public_id, "width": ancho, "height": alto}

    @classmethod
    def limpiar(cls) -> None:
        cls.subidas.clear()
        cls.borradas.clear()


def obtener_almacen() -> AlmacenFotos:
    return import_string(settings.ALMACEN_FOTOS)()


def borrables(public_ids) -> list[str]:
    """Solo las fotos propias: las de ejemplo las comparten varios artículos sembrados."""
    return [p for p in public_ids if p.startswith(PREFIJO_PROPIO)]
