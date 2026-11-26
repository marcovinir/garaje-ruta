"""Informe de coherencia de solo lectura; no consulta servicios de fotos."""

import re

from django.core.management.base import BaseCommand

from apps.articulos.models import Articulo, Auto, Repuesto
from apps.catalogos.models import Marca, Modelo
from apps.catalogos.presentacion import nombre_modelo
from apps.comun import semillas


class Command(BaseCommand):
    help = "Revisa títulos, compatibilidades, equipamiento y fotos sin modificar datos."

    def handle(self, *args, **opciones):
        hallazgos = []

        def agregar(articulo, motivo):
            hallazgos.append(f"#{articulo.pk} {articulo.titulo}: {motivo}")

        marcas = list(Marca.objects.values_list("nombre", flat=True))
        for articulo in Articulo.objects.order_by("pk"):
            for marca in marcas:
                if re.search(
                    rf"\b{re.escape(marca)}\s+{re.escape(marca)}\b", articulo.titulo, re.I
                ):
                    agregar(articulo, "marca repetida")

        modelos = list(Modelo.objects.select_related("marca"))
        # El nombre completo evita confundir Fit con otras palabras y Mazda 3 con Mazda Mazda 3.
        for repuesto in (
            Repuesto.objects.select_related("articulo")
            .prefetch_related("compatibilidades__modelo__marca")
            .order_by("pk")
        ):
            titulo = repuesto.articulo.titulo
            nombrados = {
                modelo.pk
                for modelo in modelos
                if re.search(
                    r"(?<!\w)"
                    + re.escape(nombre_modelo(modelo.marca.nombre, modelo.nombre))
                    + r"(?!\w)",
                    titulo,
                    re.I,
                )
            }
            compatibles = {c.modelo_id for c in repuesto.compatibilidades.all()}
            if nombrados - compatibles:
                agregar(repuesto.articulo, "modelo del título sin compatibilidad")
            if nombrados:
                for c in repuesto.compatibilidades.all():
                    if c.modelo_id not in nombrados:
                        agregar(
                            repuesto.articulo,
                            "compatibilidad no nombrada: "
                            + nombre_modelo(c.modelo.marca.nombre, c.modelo.nombre),
                        )

        exteriores = {foto for fotos, _ in semillas.FOTOS_MODELO.values() for foto in fotos}
        for auto in (
            Auto.objects.select_related(
                "articulo", "modelo", "carroceria", "combustible", "transmision"
            )
            .prefetch_related("equipamiento", "articulo__fotos")
            .order_by("pk")
        ):
            for equipo in auto.equipamiento.all():
                posible = semillas.equipamiento_posible(
                    equipo.nombre,
                    auto.carroceria.slug,
                    auto.combustible.nombre,
                    auto.transmision.nombre,
                    auto.anio,
                )
                excluido = equipo.nombre in semillas.EQUIPAMIENTO_EXCLUIDO_MODELO.get(
                    auto.modelo.nombre, set()
                )
                if not posible or excluido:
                    agregar(auto.articulo, f"equipamiento incompatible: {equipo.nombre}")
            propias = set(semillas.FOTOS_MODELO.get(auto.modelo.nombre, ([], ""))[0])
            for foto in auto.articulo.fotos.all():
                if foto.public_id in exteriores and foto.public_id not in propias:
                    agregar(auto.articulo, f"foto de otro modelo: {foto.public_id}")

        for hallazgo in hallazgos:
            self.stdout.write(hallazgo)
        self.stdout.write(
            f"Inconsistencias: {len(hallazgos)}. Artículos revisados: {Articulo.objects.count()}."
        )
