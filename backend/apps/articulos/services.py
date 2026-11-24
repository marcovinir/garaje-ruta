"""Escrituras de artículos desde el panel. Cada una deja su línea en el historial."""

from django.db import transaction

from apps.actividad.models import AccionHistorial, HistorialCambio
from apps.comun.errores import Conflicto

from .models import Articulo, Auto, Compatibilidad, EstadoArticulo, Repuesto, TipoArticulo

CAMPOS_ARTICULO = [
    "titulo",
    "descripcion",
    "precio_colones",
    "precio_anterior_colones",
    "destacado",
]
CAMPOS_AUTO = [
    "modelo",
    "anio",
    "version",
    "kilometraje",
    "transmision",
    "combustible",
    "traccion",
    "carroceria",
    "color_exterior",
    "color_interior",
    "cilindrada_cc",
    "puertas",
    "pasajeros",
    "bolsas_aire",
    "unico_dueno",
    "procedencia",
    "marchamo_al_dia",
    "riteve_vence",
    "impuestos_pagados",
    "acepta_vehiculo",
    "precio_negociable",
    "estado_general",
    "placa_termina_en",
]
CAMPOS_REPUESTO = ["categoria_pieza", "condicion", "cantidad", "codigo_interno", "numero_parte"]
CON_VENTAS = "Este artículo tiene ventas: ocúltalo en lugar de borrarlo."


def registrar(articulo: Articulo, usuario, accion: str, detalle: dict | None = None) -> None:
    HistorialCambio.objects.create(
        articulo=articulo, usuario=usuario, accion=accion, detalle=detalle or {}
    )


def _comparable(valor):
    """Valor legible y serializable a JSON para el historial."""
    if hasattr(valor, "_meta"):
        return str(valor)
    if hasattr(valor, "isoformat"):
        return valor.isoformat()
    return valor


def _estado_editable(articulo: Articulo) -> dict:
    datos = {c: getattr(articulo, c) for c in CAMPOS_ARTICULO}
    if articulo.tipo == TipoArticulo.AUTO:
        auto = articulo.auto
        datos |= {c: getattr(auto, c) for c in CAMPOS_AUTO}
        datos["equipamiento"] = sorted(e.nombre for e in auto.equipamiento.all())
    else:
        repuesto = articulo.repuesto
        datos |= {c: getattr(repuesto, c) for c in CAMPOS_REPUESTO}
        datos["compatibilidades"] = sorted(
            f"{c.modelo} {c.anio_desde}–{c.anio_hasta}" for c in repuesto.compatibilidades.all()
        )
    return {k: _comparable(v) for k, v in datos.items()}


def _guardar_subtipo(articulo: Articulo, datos: dict) -> None:
    if articulo.tipo == TipoArticulo.AUTO:
        datos_auto = dict(datos.get("auto") or {})
        equipamiento = datos_auto.pop("equipamiento", None)
        auto, _ = Auto.objects.get_or_create(articulo=articulo, defaults=datos_auto)
        for campo, valor in datos_auto.items():
            setattr(auto, campo, valor)
        auto.save()
        if equipamiento is not None:
            auto.equipamiento.set(equipamiento)
    else:
        datos_repuesto = dict(datos.get("repuesto") or {})
        compatibilidades = datos_repuesto.pop("compatibilidades", None)
        repuesto, _ = Repuesto.objects.get_or_create(articulo=articulo, defaults=datos_repuesto)
        for campo, valor in datos_repuesto.items():
            setattr(repuesto, campo, valor)
        repuesto.save()
        if compatibilidades is not None:
            repuesto.compatibilidades.all().delete()
            Compatibilidad.objects.bulk_create(
                Compatibilidad(repuesto=repuesto, **c) for c in compatibilidades
            )


@transaction.atomic
def crear_articulo(datos: dict, usuario) -> Articulo:
    articulo = Articulo.objects.create(
        tipo=datos["tipo"],
        creado_por=usuario,
        **{c: datos[c] for c in CAMPOS_ARTICULO if c in datos},
    )
    _guardar_subtipo(articulo, datos)
    registrar(articulo, usuario, AccionHistorial.CREAR)
    return articulo


@transaction.atomic
def editar_articulo(articulo: Articulo, datos: dict, usuario) -> Articulo:
    antes = _estado_editable(articulo)
    for campo in CAMPOS_ARTICULO:
        if campo in datos:
            setattr(articulo, campo, datos[campo])
    articulo.save()
    _guardar_subtipo(articulo, datos)
    articulo = Articulo.objects.get(pk=articulo.pk)
    despues = _estado_editable(articulo)
    cambios = {c: [antes[c], despues[c]] for c in despues if antes.get(c) != despues[c]}
    if cambios:
        registrar(articulo, usuario, AccionHistorial.EDITAR, cambios)
    return articulo


@transaction.atomic
def duplicar_articulo(articulo: Articulo, usuario) -> Articulo:
    """Copia para cargar rápido algo parecido: sin fotos, oculta hasta que la revisen."""
    copia = Articulo.objects.create(
        tipo=articulo.tipo,
        titulo=f"{articulo.titulo} (copia)",
        descripcion=articulo.descripcion,
        precio_colones=articulo.precio_colones,
        estado=EstadoArticulo.OCULTO,
        creado_por=usuario,
    )
    if articulo.tipo == TipoArticulo.AUTO:
        auto = articulo.auto
        nuevo = Auto.objects.create(articulo=copia, **{c: getattr(auto, c) for c in CAMPOS_AUTO})
        nuevo.equipamiento.set(auto.equipamiento.all())
    else:
        repuesto = articulo.repuesto
        campos = {c: getattr(repuesto, c) for c in CAMPOS_REPUESTO}
        campos["codigo_interno"] = None  # único: el duplicado necesita el suyo
        nuevo = Repuesto.objects.create(articulo=copia, **campos)
        Compatibilidad.objects.bulk_create(
            Compatibilidad(
                repuesto=nuevo, modelo=c.modelo, anio_desde=c.anio_desde, anio_hasta=c.anio_hasta
            )
            for c in repuesto.compatibilidades.all()
        )
    registrar(copia, usuario, AccionHistorial.CREAR, {"duplicado_de": articulo.id})
    return copia


@transaction.atomic
def eliminar_articulo(articulo: Articulo, usuario) -> None:
    if articulo.ventas.exists():
        raise Conflicto(CON_VENTAS)
    articulo.delete()
