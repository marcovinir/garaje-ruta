"""Guarda el tipo de cambio de hoy con el primer proveedor que responda (cron diario)."""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.module_loading import import_string

from apps.actividad.models import TipoCambio
from apps.actividad.tipo_cambio import TipoCambioNoDisponible


class Command(BaseCommand):
    help = "Actualiza el tipo de cambio del dólar de hoy (fecha de Costa Rica)."

    def handle(self, *args, **opciones):
        errores = []
        for ruta in settings.TIPO_CAMBIO_PROVEEDORES:
            proveedor = import_string(ruta)()
            try:
                compra, venta = proveedor.obtener()
            except TipoCambioNoDisponible as error:
                errores.append(f"{proveedor.nombre}: {error}")
                continue
            hoy = timezone.localdate()
            TipoCambio.objects.update_or_create(
                fecha=hoy, defaults={"compra": compra, "venta": venta, "fuente": proveedor.nombre}
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Tipo de cambio {hoy}: compra ₡{compra}, venta ₡{venta} ({proveedor.nombre})"
                )
            )
            return
        raise CommandError("Ningún proveedor respondió: " + "; ".join(errores))
