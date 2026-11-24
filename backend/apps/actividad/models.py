"""Lo que pasa con los artículos: ventas, vistas, historial y el tipo de cambio del día."""

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.articulos.models import Articulo


class Venta(models.Model):
    """Una venta registrada. `precio_unitario_colones` es la foto del precio de ese momento."""

    articulo = models.ForeignKey(Articulo, on_delete=models.PROTECT, related_name="ventas")
    cantidad = models.PositiveIntegerField()
    precio_unitario_colones = models.PositiveIntegerField()
    registrada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="ventas_registradas"
    )
    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "venta"
        ordering = ["-fecha"]
        indexes = [models.Index(fields=["fecha"], name="venta_fecha")]
        constraints = [
            models.CheckConstraint(condition=Q(cantidad__gt=0), name="venta_cantidad_positiva"),
        ]

    def __str__(self) -> str:
        return f"{self.articulo} × {self.cantidad}"


class VistaDiaria(models.Model):
    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE, related_name="vistas")
    fecha = models.DateField()
    cantidad = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "vista_diaria"
        constraints = [
            models.UniqueConstraint(fields=["articulo", "fecha"], name="vista_diaria_unica"),
        ]

    def __str__(self) -> str:
        return f"{self.articulo} · {self.fecha}: {self.cantidad}"


class AccionHistorial(models.TextChoices):
    CREAR = "crear", "Creó"
    EDITAR = "editar", "Editó"
    CAMBIAR_ESTADO = "cambiar_estado", "Cambió el estado"
    VENDER = "vender", "Registró una venta"
    DESHACER_VENTA = "deshacer_venta", "Deshizo una venta"
    FOTOS = "fotos", "Cambió las fotos"


class HistorialCambio(models.Model):
    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE, related_name="historial")
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="cambios"
    )
    accion = models.CharField(max_length=20, choices=AccionHistorial.choices)
    detalle = models.JSONField(default=dict, blank=True)
    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "historial_cambio"
        ordering = ["-fecha", "-id"]
        verbose_name_plural = "historial de cambios"

    def __str__(self) -> str:
        return f"{self.articulo} · {self.get_accion_display()}"


class TipoCambio(models.Model):
    """Tipo de cambio del dólar en colones, uno por día. Nunca se consulta la API en una visita."""

    fecha = models.DateField(unique=True)
    compra = models.DecimalField(max_digits=10, decimal_places=2)
    venta = models.DecimalField(max_digits=10, decimal_places=2)
    fuente = models.CharField(max_length=40)
    obtenido_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tipo_cambio"
        ordering = ["-fecha"]
        verbose_name_plural = "tipos de cambio"
        constraints = [
            models.CheckConstraint(
                condition=Q(compra__gt=0) & Q(venta__gt=0), name="tipo_cambio_positivo"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.fecha}: ₡{self.venta}"

    @classmethod
    def vigente(cls) -> "TipoCambio | None":
        return cls.objects.order_by("-fecha").first()
