"""Forma de los datos de artículos en el panel: escritura con ids de catálogo y lectura."""

from django.utils import timezone
from rest_framework import serializers

from apps.catalogos.models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    Equipamiento,
    Modelo,
    Traccion,
    Transmision,
)

from .models import (
    Articulo,
    CondicionRepuesto,
    EstadoGeneral,
    Procedencia,
    Repuesto,
    TipoArticulo,
)
from .serializers_publicos import TarjetaSerializer, foto_json
from .services import CAMPOS_AUTO, CAMPOS_REPUESTO


def _pk(modelo):
    return serializers.PrimaryKeyRelatedField(queryset=modelo.objects.all())


# Topes de las columnas de Postgres (PositiveIntegerField y PositiveSmallIntegerField): un
# número mayor sería un 500. El panel usa los mismos (formulario/esquema.ts).
ENTERO_MAX = 2_147_483_647
CHICO_MAX = 32_767


def _anio_hasta_el_proximo(anio: int) -> int:
    maximo = timezone.localdate().year + 1
    if anio > maximo:
        raise serializers.ValidationError(f"El año no puede ser mayor que {maximo}.")
    return anio


class AutoEscrituraSerializer(serializers.Serializer):
    modelo = _pk(Modelo)
    anio = serializers.IntegerField(min_value=1950)
    version = serializers.CharField(max_length=60, required=False, allow_blank=True, default="")
    kilometraje = serializers.IntegerField(min_value=0, max_value=ENTERO_MAX)
    transmision = _pk(Transmision)
    combustible = _pk(Combustible)
    traccion = _pk(Traccion)
    carroceria = _pk(Carroceria)
    color_exterior = serializers.CharField(max_length=40)
    color_interior = serializers.CharField(
        max_length=40, required=False, allow_blank=True, default=""
    )
    cilindrada_cc = serializers.IntegerField(
        min_value=0, max_value=ENTERO_MAX, required=False, allow_null=True
    )
    puertas = serializers.IntegerField(min_value=1, max_value=CHICO_MAX)
    pasajeros = serializers.IntegerField(min_value=1, max_value=CHICO_MAX)
    bolsas_aire = serializers.IntegerField(
        min_value=0, max_value=CHICO_MAX, required=False, default=0
    )
    unico_dueno = serializers.BooleanField()
    procedencia = serializers.ChoiceField(choices=Procedencia.choices)
    marchamo_al_dia = serializers.BooleanField()
    riteve_vence = serializers.DateField(required=False, allow_null=True)
    impuestos_pagados = serializers.BooleanField(required=False, default=True)
    acepta_vehiculo = serializers.BooleanField()
    precio_negociable = serializers.BooleanField()
    estado_general = serializers.ChoiceField(choices=EstadoGeneral.choices)
    placa_termina_en = serializers.IntegerField(
        min_value=0, max_value=9, required=False, allow_null=True
    )
    equipamiento = serializers.PrimaryKeyRelatedField(
        queryset=Equipamiento.objects.all(), many=True, required=False, default=list
    )

    def validate_anio(self, anio: int) -> int:
        return _anio_hasta_el_proximo(anio)


class CompatibilidadEscrituraSerializer(serializers.Serializer):
    modelo = _pk(Modelo)
    anio_desde = serializers.IntegerField(min_value=1950)
    anio_hasta = serializers.IntegerField(min_value=1950)

    def validate_anio_desde(self, anio: int) -> int:
        return _anio_hasta_el_proximo(anio)

    def validate_anio_hasta(self, anio: int) -> int:
        return _anio_hasta_el_proximo(anio)

    def validate(self, datos: dict) -> dict:
        if datos["anio_desde"] > datos["anio_hasta"]:
            raise serializers.ValidationError(
                {"anio_hasta": "Debe ser igual o mayor que el año desde."}
            )
        return datos


class RepuestoEscrituraSerializer(serializers.Serializer):
    categoria_pieza = _pk(CategoriaPieza)
    condicion = serializers.ChoiceField(choices=CondicionRepuesto.choices)
    cantidad = serializers.IntegerField(min_value=0, max_value=ENTERO_MAX)
    codigo_interno = serializers.CharField(
        max_length=40, required=False, allow_null=True, allow_blank=True, default=None
    )
    numero_parte = serializers.CharField(
        max_length=60, required=False, allow_blank=True, default=""
    )
    compatibilidades = CompatibilidadEscrituraSerializer(
        many=True,
        allow_empty=False,
        error_messages={"empty": "Agregá al menos una compatibilidad."},
    )

    def validate_codigo_interno(self, codigo: str | None) -> str | None:
        codigo = (codigo or "").strip() or None
        articulo = self.root.instance
        repetido = Repuesto.objects.filter(codigo_interno=codigo)
        if articulo is not None:
            repetido = repetido.exclude(articulo=articulo)
        if codigo and repetido.exists():
            raise serializers.ValidationError("Ya hay otro repuesto con ese código.")
        return codigo


class ArticuloEscrituraSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=TipoArticulo.choices)
    titulo = serializers.CharField(max_length=150)
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")
    precio_colones = serializers.IntegerField(min_value=0, max_value=ENTERO_MAX)
    precio_anterior_colones = serializers.IntegerField(
        min_value=0, max_value=ENTERO_MAX, required=False, allow_null=True, default=None
    )
    destacado = serializers.BooleanField(required=False, default=False)
    auto = AutoEscrituraSerializer(required=False)
    repuesto = RepuestoEscrituraSerializer(required=False)

    def validate(self, datos: dict) -> dict:
        articulo: Articulo | None = self.instance
        tipo = articulo.tipo if articulo else datos["tipo"]
        datos.pop("tipo", None) if articulo else None
        if articulo is None and tipo not in datos:
            raise serializers.ValidationError({tipo: "Faltan los datos del " + tipo + "."})
        otro = TipoArticulo.REPUESTO if tipo == TipoArticulo.AUTO else TipoArticulo.AUTO
        datos.pop(otro, None)

        precio = datos.get("precio_colones", articulo.precio_colones if articulo else None)
        anterior = datos.get(
            "precio_anterior_colones", articulo.precio_anterior_colones if articulo else None
        )
        if anterior is not None and precio is not None and anterior <= precio:
            raise serializers.ValidationError(
                {"precio_anterior_colones": "Debe ser mayor que el precio actual."}
            )
        return datos


class FilaPanelSerializer(TarjetaSerializer):
    agotado = serializers.BooleanField(read_only=True)
    cantidad = serializers.SerializerMethodField()
    fecha_venta = serializers.DateTimeField(read_only=True, allow_null=True)

    class Meta(TarjetaSerializer.Meta):
        fields = [
            *TarjetaSerializer.Meta.fields,
            "estado",
            "agotado",
            "cantidad",
            "destacado",
            "fecha_venta",
            "actualizado_en",
        ]

    def get_cantidad(self, articulo: Articulo) -> int | None:
        return articulo.repuesto.cantidad if articulo.tipo == TipoArticulo.REPUESTO else None


class DetallePanelSerializer(serializers.ModelSerializer):
    fotos = serializers.SerializerMethodField()
    auto = serializers.SerializerMethodField()
    repuesto = serializers.SerializerMethodField()

    class Meta:
        model = Articulo
        fields = [
            "id",
            "tipo",
            "titulo",
            "descripcion",
            "precio_colones",
            "precio_anterior_colones",
            "destacado",
            "estado",
            "publicado_en",
            "actualizado_en",
            "fotos",
            "auto",
            "repuesto",
        ]

    def get_fotos(self, articulo: Articulo) -> list[dict]:
        return [foto_json(f) for f in articulo.fotos.all()]

    def get_auto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.AUTO:
            return None
        auto = articulo.auto
        datos = {c: getattr(auto, f"{c}_id", getattr(auto, c)) for c in CAMPOS_AUTO}
        datos["riteve_vence"] = auto.riteve_vence.isoformat() if auto.riteve_vence else None
        datos["equipamiento"] = sorted(e.id for e in auto.equipamiento.all())
        return datos

    def get_repuesto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.REPUESTO:
            return None
        repuesto = articulo.repuesto
        datos = {c: getattr(repuesto, f"{c}_id", getattr(repuesto, c)) for c in CAMPOS_REPUESTO}
        datos["compatibilidades"] = [
            {
                "id": c.id,
                "modelo": c.modelo_id,
                "anio_desde": c.anio_desde,
                "anio_hasta": c.anio_hasta,
            }
            for c in repuesto.compatibilidades.all()
        ]
        return datos


class FotoEntradaSerializer(serializers.Serializer):
    public_id = serializers.CharField(max_length=255)
    ancho = serializers.IntegerField(min_value=1)
    alto = serializers.IntegerField(min_value=1)
