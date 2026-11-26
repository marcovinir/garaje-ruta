"""Lo que ve el público de un artículo. El tipo de cambio llega en el contexto."""

from django.db.models import Sum
from rest_framework import serializers

from apps.catalogos.presentacion import nombre_modelo

from .models import COMBUSTIBLES_CON_BATERIA, Articulo, TipoArticulo
from .presentacion import precio_usd, ruta_publica


def foto_json(foto) -> dict | None:
    if foto is None:
        return None
    return {"public_id": foto.public_id, "ancho": foto.ancho, "alto": foto.alto}


def resumen_compatibilidad(repuesto) -> str:
    compatibilidades = sorted(
        repuesto.compatibilidades.all(), key=lambda c: (c.anio_desde, c.modelo.nombre)
    )
    if not compatibilidades:
        return ""
    primera = compatibilidades[0]
    nombre = nombre_modelo(primera.modelo.marca.nombre, primera.modelo.nombre)
    texto = f"{nombre} {primera.anio_desde}–{primera.anio_hasta}"
    resto = len(compatibilidades) - 1
    return f"{texto} y {resto} más" if resto else texto


class TarjetaSerializer(serializers.ModelSerializer):
    ruta = serializers.SerializerMethodField()
    estado_publico = serializers.SerializerMethodField()
    precio_usd = serializers.SerializerMethodField()
    foto = serializers.SerializerMethodField()
    auto = serializers.SerializerMethodField()
    repuesto = serializers.SerializerMethodField()

    class Meta:
        model = Articulo
        fields = [
            "id",
            "tipo",
            "titulo",
            "ruta",
            "estado_publico",
            "precio_colones",
            "precio_anterior_colones",
            "precio_usd",
            "foto",
            "auto",
            "repuesto",
        ]

    def get_estado_publico(self, articulo: Articulo) -> str:
        from .selectors import estado_publico

        return estado_publico(articulo)

    def get_ruta(self, articulo: Articulo) -> str:
        return ruta_publica(articulo)

    def get_precio_usd(self, articulo: Articulo) -> int | None:
        return precio_usd(articulo.precio_colones, self.context.get("tipo_cambio"))

    def get_foto(self, articulo: Articulo) -> dict | None:
        # Usa las fotos ya precargadas (prefetch) en vez de otra consulta por tarjeta.
        principal = next((f for f in articulo.fotos.all() if f.orden == 1), None)
        return foto_json(principal)

    def get_auto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.AUTO:
            return None
        auto = articulo.auto
        marca, modelo = auto.modelo.marca.nombre, auto.modelo.nombre
        return {
            "marca": marca,
            "modelo": modelo,
            "nombre_vehiculo": nombre_modelo(marca, modelo),
            "anio": auto.anio,
            "kilometraje": auto.kilometraje,
            "transmision": auto.transmision.nombre,
            "combustible": auto.combustible.nombre,
        }

    def get_repuesto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.REPUESTO:
            return None
        repuesto = articulo.repuesto
        return {
            "condicion": repuesto.condicion,
            "cantidad": repuesto.cantidad,
            "categoria": repuesto.categoria_pieza.nombre,
            "compatibilidad_resumen": resumen_compatibilidad(repuesto),
        }


def equipamiento_agrupado(auto) -> list[dict]:
    grupos: dict[tuple, list] = {}
    for e in sorted(auto.equipamiento.all(), key=lambda e: (e.grupo.orden, e.orden, e.nombre)):
        grupos.setdefault((e.grupo.orden, e.grupo.nombre), []).append(e.nombre)
    return [{"grupo": nombre, "items": items} for (_, nombre), items in sorted(grupos.items())]


class FichaSerializer(TarjetaSerializer):
    fotos = serializers.SerializerMethodField()
    vistas_total = serializers.SerializerMethodField()

    class Meta(TarjetaSerializer.Meta):
        fields = [
            *TarjetaSerializer.Meta.fields,
            "descripcion",
            "publicado_en",
            "fotos",
            "vistas_total",
        ]

    def get_fotos(self, articulo: Articulo) -> list[dict]:
        return [foto_json(f) for f in articulo.fotos.all()]

    def get_vistas_total(self, articulo: Articulo) -> int:
        return articulo.vistas.aggregate(total=Sum("cantidad"))["total"] or 0

    def get_auto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.AUTO:
            return None
        a = articulo.auto
        con_bateria = a.combustible.nombre in COMBUSTIBLES_CON_BATERIA
        return {
            "marca": a.modelo.marca.nombre,
            "modelo": a.modelo.nombre,
            "nombre_vehiculo": nombre_modelo(a.modelo.marca.nombre, a.modelo.nombre),
            "anio": a.anio,
            "version": a.version,
            "kilometraje": a.kilometraje,
            "transmision": a.transmision.nombre,
            "combustible": a.combustible.nombre,
            "traccion": a.traccion.nombre,
            "carroceria": a.carroceria.nombre,
            "color_exterior": a.color_exterior,
            "color_interior": a.color_interior,
            "cilindrada_cc": a.cilindrada_cc,
            "puertas": a.puertas,
            "pasajeros": a.pasajeros,
            "bolsas_aire": a.bolsas_aire,
            "unico_dueno": a.unico_dueno,
            "procedencia": a.procedencia,
            "marchamo_al_dia": a.marchamo_al_dia,
            "riteve_vence": a.riteve_vence.isoformat() if a.riteve_vence else None,
            "impuestos_pagados": a.impuestos_pagados,
            "acepta_vehiculo": a.acepta_vehiculo,
            "precio_negociable": a.precio_negociable,
            "estado_general": a.estado_general,
            "placa_termina_en": a.placa_termina_en,
            "equipamiento": equipamiento_agrupado(a),
            "marchamo_anio": a.marchamo_anio,
            "traspaso_incluido": a.traspaso_incluido,
            "financiamiento": a.financiamiento,
            "sin_gravamenes": a.sin_gravamenes,
            "historial_mantenimiento": a.historial_mantenimiento,
            "historial_accidentes": a.historial_accidentes,
            "garantia": a.garantia,
            "bateria_kwh": a.bateria_kwh if con_bateria else None,
            "bateria_salud_pct": a.bateria_salud_pct if con_bateria else None,
            "autonomia_km": a.autonomia_km if con_bateria else None,
            "tipo_carga": a.tipo_carga if con_bateria else None,
        }

    def get_repuesto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.REPUESTO:
            return None
        r = articulo.repuesto
        categoria = r.categoria_pieza
        return {
            "condicion": r.condicion,
            "categoria": {
                "nombre": categoria.nombre,
                "padre": categoria.padre.nombre if categoria.padre else None,
            },
            "cantidad": r.cantidad,
            "numero_parte": r.numero_parte,
            "fabricante": r.fabricante,
            "clasificacion": r.clasificacion,
            "compatibilidades": [
                {
                    "marca": c.modelo.marca.nombre,
                    "modelo": c.modelo.nombre,
                    "anio_desde": c.anio_desde,
                    "anio_hasta": c.anio_hasta,
                    "motor_version": c.motor_version,
                }
                for c in sorted(
                    r.compatibilidades.all(), key=lambda c: (c.anio_desde, c.modelo.nombre)
                )
            ],
        }
