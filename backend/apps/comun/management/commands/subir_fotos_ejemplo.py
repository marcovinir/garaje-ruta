"""Sube las fotos de ejemplo (generadas; ver docs/fotos-ejemplo.md) a Cloudinary."""

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.articulos.fotos import PREFIJO_EJEMPLO, obtener_almacen
from apps.articulos.models import Foto
from apps.comun import semillas

EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")


def _buscar(origen: Path, nombre: str) -> Path | None:
    return next(
        (origen / f"{nombre}{e}" for e in EXTENSIONES if (origen / f"{nombre}{e}").exists()),
        None,
    )


class Command(BaseCommand):
    help = "Sube auto-01…auto-24 y repuesto-01…repuesto-16 como garaje-ruta/ejemplo/<nombre>."

    def add_arguments(self, parser):
        parser.add_argument("--carpeta", required=True, help="Carpeta con las imágenes.")

    def handle(self, *args, carpeta: str, **opciones):
        origen = Path(carpeta)
        if not origen.is_dir():
            raise CommandError(f"No existe la carpeta {origen}.")
        almacen = obtener_almacen()
        subidas = 0
        for public_id in semillas.FOTOS_AUTOS + semillas.FOTOS_REPUESTOS:
            nombre = public_id.removeprefix(PREFIJO_EJEMPLO)
            archivo = _buscar(origen, nombre)
            if archivo is None:
                self.stdout.write(f"Falta {nombre}: se omite.")
                continue
            resultado = almacen.subir(archivo, public_id)
            Foto.objects.filter(public_id=public_id).update(
                ancho=resultado["width"], alto=resultado["height"]
            )
            subidas += 1
        self.stdout.write(self.style.SUCCESS(f"Fotos de ejemplo subidas: {subidas}."))
