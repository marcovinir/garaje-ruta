import pytest
from django.utils import timezone

from apps.actividad.models import HistorialCambio, Venta
from apps.articulos.models import Articulo, Compatibilidad, EstadoArticulo, Foto
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, modelo
from apps.catalogos.models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    Equipamiento,
    Traccion,
    Transmision,
)
from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario

URL = "/api/v1/panel/articulos/"


def usuario(rol: str):
    return Usuario.objects.crear_usuario(
        f"{rol}@x.test", rol.title(), "X", rol, password="Clave-Segura-2026", activo=True
    )


@pytest.fixture
def admin(db):
    return cliente_de(usuario("admin"))


@pytest.fixture
def colaborador(db):
    return cliente_de(usuario("colaborador"))


def datos_auto(**cambios) -> dict:
    corolla = modelo("Toyota", "Corolla")
    auto = {
        "modelo": corolla.id,
        "anio": 2018,
        "version": "SE",
        "kilometraje": 80_000,
        "transmision": Transmision.objects.get(nombre="Automática").id,
        "combustible": Combustible.objects.get(nombre="Gasolina").id,
        "traccion": Traccion.objects.get(nombre="4x2").id,
        "carroceria": Carroceria.objects.get(slug="sedan").id,
        "color_exterior": "Gris",
        "color_interior": "Negro",
        "cilindrada_cc": 1800,
        "puertas": 4,
        "pasajeros": 5,
        "bolsas_aire": 6,
        "unico_dueno": True,
        "procedencia": "agencia",
        "marchamo_al_dia": True,
        "riteve_vence": "2027-05-01",
        "impuestos_pagados": True,
        "acepta_vehiculo": False,
        "precio_negociable": True,
        "estado_general": "excelente",
        "placa_termina_en": 4,
        "equipamiento": [Equipamiento.objects.get(nombre="Aire acondicionado").id],
    }
    auto.update(cambios)
    return {
        "tipo": "auto",
        "titulo": "Toyota Corolla 2018 SE",
        "descripcion": "Impecable.",
        "precio_colones": 9_800_000,
        "precio_anterior_colones": None,
        "destacado": False,
        "auto": auto,
    }


def datos_repuesto(compatibilidades=None) -> dict:
    corolla = modelo("Toyota", "Corolla")
    return {
        "tipo": "repuesto",
        "titulo": "Alternador Toyota Corolla",
        "precio_colones": 65_000,
        "repuesto": {
            "categoria_pieza": CategoriaPieza.objects.get(slug="sistema-electrico").id,
            "condicion": "usado",
            "cantidad": 3,
            "codigo_interno": "GR-X1",
            "numero_parte": "27060",
            "compatibilidades": compatibilidades
            if compatibilidades is not None
            else [{"modelo": corolla.id, "anio_desde": 2012, "anio_hasta": 2016}],
        },
    }


def test_crear_auto(admin):
    r = admin.post(URL, datos_auto(), format="json")
    assert r.status_code == 201, r.json()
    articulo = Articulo.objects.get(id=r.json()["id"])
    assert articulo.auto.anio == 2018
    assert list(articulo.auto.equipamiento.values_list("nombre", flat=True)) == [
        "Aire acondicionado"
    ]
    assert HistorialCambio.objects.get(articulo=articulo).accion == "crear"
    assert r.json()["auto"]["modelo"] == articulo.auto.modelo_id


def test_crear_repuesto(colaborador):
    r = colaborador.post(URL, datos_repuesto(), format="json")
    assert r.status_code == 201, r.json()
    articulo = Articulo.objects.get(id=r.json()["id"])
    assert articulo.repuesto.compatibilidades.count() == 1


def test_anio_futuro_rechazado(admin):
    futuro = timezone.localdate().year + 2
    r = admin.post(URL, datos_auto(anio=futuro), format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["auto.anio"] == [
        f"El año no puede ser mayor que {timezone.localdate().year + 1}."
    ]


def test_repuesto_sin_compatibilidades_rechazado(admin):
    r = admin.post(URL, datos_repuesto(compatibilidades=[]), format="json")
    assert r.status_code == 400
    assert "repuesto.compatibilidades" in r.json()["campos"]


def test_editar_registra_lo_que_cambio(admin):
    a = crear_auto()
    r = admin.patch(f"{URL}{a.id}/", {"precio_colones": 6_200_000}, format="json")
    assert r.status_code == 200, r.json()
    cambio = HistorialCambio.objects.get(articulo=a, accion="editar")
    assert cambio.detalle == {"precio_colones": [6_500_000, 6_200_000]}


def test_editar_reemplaza_compatibilidades_y_no_cambia_tipo(admin):
    r = crear_repuesto()
    Compatibilidad.objects.create(
        repuesto=r.repuesto, modelo=modelo("Toyota", "Yaris"), anio_desde=2010, anio_hasta=2012
    )
    rio = modelo("Kia", "Rio")
    respuesta = admin.patch(
        f"{URL}{r.id}/",
        {
            "tipo": "auto",
            "repuesto": {
                "compatibilidades": [{"modelo": rio.id, "anio_desde": 2015, "anio_hasta": 2018}]
            },
        },
        format="json",
    )
    assert respuesta.status_code == 200, respuesta.json()
    r.refresh_from_db()
    assert r.tipo == "repuesto"
    assert [c.modelo.nombre for c in r.repuesto.compatibilidades.all()] == ["Rio"]


def test_duplicar(admin):
    a = crear_auto(destacado=True, precio_anterior_colones=7_000_000)
    a.auto.equipamiento.add(Equipamiento.objects.get(nombre="Bluetooth"))
    Foto.objects.create(articulo=a, public_id="garaje-ruta/articulos/x", ancho=1, alto=1, orden=1)
    r = admin.post(f"{URL}{a.id}/duplicar/")
    assert r.status_code == 201
    copia = Articulo.objects.get(id=r.json()["id"])
    assert copia.titulo == "Toyota Corolla 2015 (copia)"
    assert copia.estado == EstadoArticulo.OCULTO
    assert copia.destacado is False and copia.precio_anterior_colones is None
    assert copia.fotos.count() == 0
    assert list(copia.auto.equipamiento.values_list("nombre", flat=True)) == ["Bluetooth"]


def test_eliminar(admin):
    a = crear_auto()
    assert admin.delete(f"{URL}{a.id}/").status_code == 204
    assert not Articulo.objects.filter(id=a.id).exists()


def test_eliminar_con_ventas_409(admin):
    a = crear_auto()
    Venta.objects.create(
        articulo=a, cantidad=1, precio_unitario_colones=1, registrada_por=a.creado_por
    )
    r = admin.delete(f"{URL}{a.id}/")
    assert r.status_code == 409
    assert r.json()["detalle"] == "Este artículo tiene ventas: ocúltalo en lugar de borrarlo."


def test_colaborador_no_elimina(colaborador):
    a = crear_auto()
    assert colaborador.delete(f"{URL}{a.id}/").status_code == 403


def test_listado_del_panel(admin):
    vendido = crear_auto(estado=EstadoArticulo.VENDIDO)
    Venta.objects.create(
        articulo=vendido, cantidad=1, precio_unitario_colones=1, registrada_por=vendido.creado_por
    )
    agotado = crear_repuesto(cantidad=0)
    crear_repuesto(cantidad=4)
    datos = admin.get(URL).json()
    assert datos["count"] == 3
    fila = next(f for f in datos["results"] if f["id"] == vendido.id)
    assert fila["estado"] == "vendido" and fila["fecha_venta"]
    assert [f["id"] for f in admin.get(f"{URL}?agotado=1").json()["results"]] == [agotado.id]
    assert admin.get(f"{URL}?estado=vendido").json()["count"] == 1
    assert admin.get(f"{URL}?tipo=repuesto").json()["count"] == 2
    assert admin.get(f"{URL}?q=corolla").json()["count"] == 1


def test_detalle_del_panel(admin):
    r = crear_repuesto()
    corolla = modelo("Toyota", "Corolla")
    Compatibilidad.objects.create(
        repuesto=r.repuesto, modelo=corolla, anio_desde=2012, anio_hasta=2016
    )
    datos = admin.get(f"{URL}{r.id}/").json()
    assert datos["repuesto"]["compatibilidades"][0]["modelo"] == corolla.id
    assert datos["repuesto"]["categoria_pieza"] == r.repuesto.categoria_pieza_id


def test_listado_del_panel_ignora_fechas_invalidas(admin):
    crear_auto()
    assert admin.get(f"{URL}?desde=abc").status_code == 200
    assert admin.get(f"{URL}?hasta=2026-99-99").json()["count"] == 1
    assert admin.get(f"{URL}?desde=2999-01-01").json()["count"] == 0
