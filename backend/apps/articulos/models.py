"""Artículos del catálogo: un `Articulo` común con su subtipo `Auto` o `Repuesto` (§6)."""

from django.conf import settings
from django.contrib.postgres.indexes import GinIndex, OpClass
from django.core.validators import MaxValueValidator
from django.db import models
from django.db.models import Deferrable, F, Q
from django.utils import timezone

from apps.catalogos.models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    Equipamiento,
    Modelo,
    Traccion,
    Transmision,
)


class TipoArticulo(models.TextChoices):
    AUTO = "auto", "Auto"
    REPUESTO = "repuesto", "Repuesto"


class EstadoArticulo(models.TextChoices):
    DISPONIBLE = "disponible", "Disponible"
    RESERVADO = "reservado", "Reservado"
    VENDIDO = "vendido", "Vendido"
    OCULTO = "oculto", "Oculto"


class CondicionRepuesto(models.TextChoices):
    NUEVO = "nuevo", "Nuevo"
    USADO = "usado", "Usado"


class ClasificacionRepuesto(models.TextChoices):
    ORIGINAL = "original", "Original"
    OEM = "oem", "OEM"
    GENERICO = "generico", "Genérico"


COMBUSTIBLES_CON_BATERIA = {"Eléctrico", "Híbrido enchufable"}


class Procedencia(models.TextChoices):
    AGENCIA = "agencia", "De agencia"
    IMPORTADO = "importado", "Importado"


class EstadoGeneral(models.TextChoices):
    EXCELENTE = "excelente", "Excelente"
    MUY_BUENO = "muy_bueno", "Muy bueno"
    BUENO = "bueno", "Bueno"
    REGULAR = "regular", "Regular"


class Articulo(models.Model):
    """Lo común a autos y repuestos. «Agotado» no es un estado: es un repuesto en cantidad 0."""

    tipo = models.CharField(max_length=10, choices=TipoArticulo.choices)
    titulo = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    precio_colones = models.PositiveIntegerField()
    precio_anterior_colones = models.PositiveIntegerField(null=True, blank=True)
    estado = models.CharField(
        max_length=12, choices=EstadoArticulo.choices, default=EstadoArticulo.DISPONIBLE
    )
    destacado = models.BooleanField(default=False)
    publicado_en = models.DateTimeField(default=timezone.now)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="articulos_creados"
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "articulo"
        ordering = ["-publicado_en"]
        indexes = [
            models.Index(fields=["tipo", "estado"], name="articulo_tipo_estado"),
            models.Index(fields=["-publicado_en"], name="articulo_publicado"),
            # Búsqueda por parecido del título (pg_trgm); ver la migración 0004.
            GinIndex(OpClass("titulo", name="gin_trgm_ops"), name="articulo_titulo_trgm"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(precio_anterior_colones__isnull=True)
                | Q(precio_anterior_colones__gt=F("precio_colones")),
                name="articulo_precio_anterior_mayor",
            ),
            models.CheckConstraint(
                condition=Q(tipo__in=TipoArticulo.values), name="articulo_tipo_valido"
            ),
            models.CheckConstraint(
                condition=Q(estado__in=EstadoArticulo.values), name="articulo_estado_valido"
            ),
            # §7: un repuesto nunca pasa a «Vendido»; se agota al llegar a cantidad 0.
            models.CheckConstraint(
                condition=~Q(tipo=TipoArticulo.REPUESTO, estado=EstadoArticulo.VENDIDO),
                name="articulo_repuesto_no_vendido",
            ),
        ]

    def __str__(self) -> str:
        return self.titulo

    @property
    def foto_principal(self) -> "Foto | None":
        return self.fotos.filter(orden=1).first()

    @property
    def agotado(self) -> bool:
        return self.tipo == TipoArticulo.REPUESTO and self.repuesto.cantidad == 0


class Auto(models.Model):
    articulo = models.OneToOneField(
        Articulo, on_delete=models.CASCADE, primary_key=True, related_name="auto"
    )
    modelo = models.ForeignKey(Modelo, on_delete=models.PROTECT, related_name="autos")
    anio = models.PositiveSmallIntegerField()
    version = models.CharField(max_length=60, blank=True)
    kilometraje = models.PositiveIntegerField()
    transmision = models.ForeignKey(Transmision, on_delete=models.PROTECT)
    combustible = models.ForeignKey(Combustible, on_delete=models.PROTECT)
    traccion = models.ForeignKey(Traccion, on_delete=models.PROTECT)
    carroceria = models.ForeignKey(Carroceria, on_delete=models.PROTECT)
    color_exterior = models.CharField(max_length=40)
    color_interior = models.CharField(max_length=40, blank=True)
    cilindrada_cc = models.PositiveIntegerField(null=True, blank=True)  # vacía en eléctricos
    puertas = models.PositiveSmallIntegerField()
    pasajeros = models.PositiveSmallIntegerField()
    bolsas_aire = models.PositiveSmallIntegerField(default=0)
    unico_dueno = models.BooleanField()
    procedencia = models.CharField(max_length=10, choices=Procedencia.choices)
    marchamo_al_dia = models.BooleanField()
    riteve_vence = models.DateField(null=True, blank=True)
    impuestos_pagados = models.BooleanField(default=True)
    acepta_vehiculo = models.BooleanField()
    precio_negociable = models.BooleanField()
    estado_general = models.CharField(max_length=10, choices=EstadoGeneral.choices)
    # Solo el último dígito: en Costa Rica define el día de restricción vehicular.
    placa_termina_en = models.PositiveSmallIntegerField(null=True, blank=True)
    # Los datos comerciales usan NULL para representar «sin dato», también en texto.
    marchamo_anio = models.PositiveSmallIntegerField(null=True, blank=True)
    traspaso_incluido = models.BooleanField(null=True, blank=True)
    financiamiento = models.BooleanField(null=True, blank=True)
    sin_gravamenes = models.BooleanField(null=True, blank=True)
    historial_mantenimiento = models.CharField(max_length=250, null=True, blank=True)  # noqa: DJ001
    historial_accidentes = models.CharField(max_length=250, null=True, blank=True)  # noqa: DJ001
    garantia = models.CharField(max_length=250, null=True, blank=True)  # noqa: DJ001
    bateria_kwh = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    bateria_salud_pct = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MaxValueValidator(100)]
    )
    autonomia_km = models.PositiveIntegerField(null=True, blank=True)
    tipo_carga = models.CharField(max_length=80, null=True, blank=True)  # noqa: DJ001
    equipamiento = models.ManyToManyField(
        Equipamiento, through="AutoEquipamiento", related_name="autos", blank=True
    )

    class Meta:
        db_table = "auto"
        constraints = [
            # El máximo (año actual + 1) lo valida la API porque cambia con el tiempo.
            models.CheckConstraint(condition=Q(anio__gte=1950), name="auto_anio_minimo"),
            models.CheckConstraint(condition=Q(puertas__gt=0), name="auto_puertas_positivas"),
            models.CheckConstraint(condition=Q(pasajeros__gt=0), name="auto_pasajeros_positivos"),
            models.CheckConstraint(
                condition=Q(placa_termina_en__isnull=True) | Q(placa_termina_en__lte=9),
                name="auto_placa_digito",
            ),
            models.CheckConstraint(
                condition=Q(procedencia__in=Procedencia.values), name="auto_procedencia_valida"
            ),
            models.CheckConstraint(
                condition=Q(estado_general__in=EstadoGeneral.values),
                name="auto_estado_general_valido",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.modelo} {self.anio}"


class AutoEquipamiento(models.Model):
    auto = models.ForeignKey(Auto, on_delete=models.CASCADE)
    equipamiento = models.ForeignKey(Equipamiento, on_delete=models.PROTECT)

    class Meta:
        db_table = "auto_equipamiento"
        constraints = [
            models.UniqueConstraint(
                fields=["auto", "equipamiento"], name="auto_equipamiento_unico"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.auto} · {self.equipamiento}"


class Repuesto(models.Model):
    articulo = models.OneToOneField(
        Articulo, on_delete=models.CASCADE, primary_key=True, related_name="repuesto"
    )
    categoria_pieza = models.ForeignKey(
        CategoriaPieza, on_delete=models.PROTECT, related_name="repuestos"
    )
    condicion = models.CharField(max_length=10, choices=CondicionRepuesto.choices)
    cantidad = models.PositiveIntegerField(default=1)
    codigo_interno = models.CharField(max_length=40, null=True, blank=True, unique=True)  # noqa: DJ001
    numero_parte = models.CharField(max_length=60, blank=True)
    fabricante = models.CharField(max_length=80, null=True, blank=True)  # noqa: DJ001
    clasificacion = models.CharField(  # noqa: DJ001
        max_length=8, choices=ClasificacionRepuesto.choices, null=True, blank=True
    )

    class Meta:
        db_table = "repuesto"
        constraints = [
            models.CheckConstraint(
                condition=Q(condicion__in=CondicionRepuesto.values),
                name="repuesto_condicion_valida",
            ),
        ]

    def __str__(self) -> str:
        return self.articulo.titulo


class Compatibilidad(models.Model):
    repuesto = models.ForeignKey(
        Repuesto, on_delete=models.CASCADE, related_name="compatibilidades"
    )
    modelo = models.ForeignKey(Modelo, on_delete=models.PROTECT, related_name="compatibilidades")
    anio_desde = models.PositiveSmallIntegerField()
    anio_hasta = models.PositiveSmallIntegerField()
    motor_version = models.CharField(max_length=80, null=True, blank=True)  # noqa: DJ001

    class Meta:
        db_table = "compatibilidad"
        verbose_name_plural = "compatibilidades"
        indexes = [
            models.Index(
                fields=["modelo", "anio_desde", "anio_hasta"], name="compatibilidad_busqueda"
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(anio_desde__lte=F("anio_hasta")), name="compatibilidad_rango_anios"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.modelo} {self.anio_desde}–{self.anio_hasta}"


class Foto(models.Model):
    """La principal es la de `orden = 1` (no hay columna `es_principal`)."""

    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE, related_name="fotos")
    public_id = models.CharField(max_length=255)
    ancho = models.PositiveIntegerField()
    alto = models.PositiveIntegerField()
    orden = models.PositiveSmallIntegerField()

    class Meta:
        db_table = "foto"
        ordering = ["orden"]
        constraints = [
            # Diferida: permite intercambiar órdenes dentro de una transacción.
            models.UniqueConstraint(
                fields=["articulo", "orden"],
                name="foto_orden_unico",
                deferrable=Deferrable.DEFERRED,
            ),
            models.CheckConstraint(condition=Q(orden__gte=1), name="foto_orden_positivo"),
        ]

    def __str__(self) -> str:
        return f"{self.articulo} · foto {self.orden}"
