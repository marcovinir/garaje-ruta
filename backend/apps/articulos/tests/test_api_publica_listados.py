from datetime import date
from decimal import Decimal

from rest_framework.test import APIClient

from apps.actividad.models import TipoCambio
from apps.articulos.models import Compatibilidad, EstadoArticulo, Foto
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, modelo


def tipo_cambio():
    TipoCambio.objects.create(
        fecha=date(2026, 11, 24), compra=Decimal("442.25"), venta=Decimal("448.25"), fuente="x"
    )


def test_tarjeta_de_auto(db):
    tipo_cambio()
    a = crear_auto(precio_anterior_colones=7_000_000)
    Foto.objects.create(
        articulo=a, public_id="garaje-ruta/ejemplo/auto-01", ancho=1600, alto=1200, orden=1
    )
    r = APIClient().get("/api/v1/articulos/")
    assert r.status_code == 200
    assert r.json()["count"] == 1
    (tarjeta,) = r.json()["results"]
    assert tarjeta == {
        "id": a.id,
        "tipo": "auto",
        "titulo": "Toyota Corolla 2015",
        "ruta": f"/autos/toyota-corolla-2015-{a.id}",
        "precio_colones": 6_500_000,
        "precio_anterior_colones": 7_000_000,
        "precio_usd": 14_500,
        "foto": {"public_id": "garaje-ruta/ejemplo/auto-01", "ancho": 1600, "alto": 1200},
        "auto": {
            "anio": 2015,
            "kilometraje": 120_000,
            "transmision": "Automática",
            "combustible": "Gasolina",
        },
        "repuesto": None,
    }


def test_tarjeta_de_repuesto_con_resumen_de_compatibilidad(db):
    r = crear_repuesto()
    for nombre, desde, hasta in (
        ("Accent", 2012, 2016),
        ("Elantra", 2014, 2018),
        ("i10", 2015, 2019),
    ):
        Compatibilidad.objects.create(
            repuesto=r.repuesto,
            modelo=modelo("Hyundai", nombre),
            anio_desde=desde,
            anio_hasta=hasta,
        )
    (tarjeta,) = APIClient().get("/api/v1/articulos/?tipo=repuesto").json()["results"]
    assert tarjeta["auto"] is None
    assert tarjeta["foto"] is None
    assert tarjeta["precio_usd"] is None
    assert tarjeta["repuesto"] == {
        "condicion": "usado",
        "categoria": "Sistema eléctrico",
        "compatibilidad_resumen": "Accent 2012–2016 y 2 más",
    }


def test_no_visibles_no_aparecen_y_pagina(db):
    for _ in range(21):
        crear_auto()
    crear_auto(estado=EstadoArticulo.VENDIDO)
    crear_repuesto(cantidad=0)
    datos = APIClient().get("/api/v1/articulos/").json()
    assert datos["count"] == 21
    assert len(datos["results"]) == 20
    assert datos["next"]


def test_filtros_por_query_string(db):
    crear_auto(precio=3_000_000)
    caro = crear_auto(precio=9_000_000)
    datos = APIClient().get("/api/v1/articulos/?precio_min=5000000").json()
    assert [t["id"] for t in datos["results"]] == [caro.id]


def test_destacados_completa_hasta_8(db):
    destacados = [crear_auto(destacado=True) for _ in range(3)]
    otros = [crear_auto() for _ in range(7)]
    crear_auto(destacado=True, estado=EstadoArticulo.VENDIDO)
    ids = [t["id"] for t in APIClient().get("/api/v1/destacados/").json()]
    assert len(ids) == 8
    assert ids[:3] == [a.id for a in reversed(destacados)]
    assert set(ids[3:]) <= {a.id for a in otros}
