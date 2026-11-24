"""Datos del negocio que el admin edita desde el panel (una sola fila)."""

from django.db import models
from django.db.models import F, Q


class ConfiguracionNegocio(models.Model):
    nombre = models.CharField(max_length=80)
    logo_public_id = models.CharField(max_length=255, blank=True)
    whatsapp = models.CharField(max_length=20)  # con código de país, solo dígitos: 506…
    direccion = models.CharField(max_length=200)
    mapa_url = models.URLField(max_length=500, blank=True)

    class Meta:
        db_table = "configuracion_negocio"
        verbose_name = "configuración del negocio"
        constraints = [models.CheckConstraint(condition=Q(id=1), name="configuracion_unica")]

    def __str__(self) -> str:
        return self.nombre

    @classmethod
    def obtener(cls) -> "ConfiguracionNegocio":
        return cls.objects.get(pk=1)


class HorarioAtencion(models.Model):
    """dia_semana: 0 = lunes … 6 = domingo. Permite turnos partidos."""

    configuracion = models.ForeignKey(
        ConfiguracionNegocio, on_delete=models.CASCADE, related_name="horarios"
    )
    dia_semana = models.PositiveSmallIntegerField()
    apertura = models.TimeField()
    cierre = models.TimeField()

    class Meta:
        db_table = "horario_atencion"
        ordering = ["dia_semana", "apertura"]
        verbose_name_plural = "horarios de atención"
        constraints = [
            models.CheckConstraint(condition=Q(dia_semana__lte=6), name="horario_dia_valido"),
            models.CheckConstraint(
                condition=Q(apertura__lt=F("cierre")), name="horario_apertura_antes_cierre"
            ),
        ]

    DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

    def __str__(self) -> str:
        return f"{self.DIAS[self.dia_semana]} {self.apertura:%H:%M}–{self.cierre:%H:%M}"
