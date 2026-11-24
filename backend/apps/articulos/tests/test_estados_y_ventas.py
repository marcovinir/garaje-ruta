import pytest

from apps.actividad.models import HistorialCambio, Venta
from apps.articulos.models import EstadoArticulo
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto
from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario

URL = "/api/v1/panel/articulos/"


@pytest.fixture
def colaborador(db):
    u = Usuario.objects.crear_usuario(
        "c@x.test", "C", "X", "colaborador", password="Clave-Segura-2026", activo=True
    )
    return cliente_de(u)


def estado(cliente, articulo, nuevo):
    return cliente.post(f"{URL}{articulo.id}/estado/", {"estado": nuevo}, format="json")


@pytest.mark.parametrize(
    "desde,hacia",
    [
        ("disponible", "reservado"),
        ("reservado", "disponible"),
        ("disponible", "oculto"),
        ("oculto", "disponible"),
        ("reservado", "oculto"),
        ("oculto", "reservado"),
    ],
)
def test_transiciones_validas(colaborador, desde, hacia):
    a = crear_auto(estado=desde)
    r = estado(colaborador, a, hacia)
    assert r.status_code == 200, r.json()
    a.refresh_from_db()
    assert a.estado == hacia
    cambio = HistorialCambio.objects.get(articulo=a, accion="cambiar_estado")
    assert cambio.detalle == {"antes": desde, "despues": hacia}


def test_pedir_vendido_por_estado_400(colaborador):
    r = estado(colaborador, crear_auto(), "vendido")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Para vender usa “Vendido” o “Vendí”."


def test_salir_de_vendido_por_estado_409(colaborador):
    r = estado(colaborador, crear_auto(estado=EstadoArticulo.VENDIDO), "disponible")
    assert r.status_code == 409
    assert r.json()["detalle"] == "Deshaz la venta para cambiar el estado."


def test_vender_auto(colaborador):
    a = crear_auto(estado=EstadoArticulo.RESERVADO)
    r = colaborador.post(f"{URL}{a.id}/vender/")
    assert r.status_code == 201, r.json()
    a.refresh_from_db()
    assert a.estado == EstadoArticulo.VENDIDO
    venta = Venta.objects.get(articulo=a)
    assert (venta.cantidad, venta.precio_unitario_colones) == (1, 6_500_000)
    assert r.json()["venta_id"] == venta.id
    assert r.json()["articulo"]["estado"] == "vendido"
    assert HistorialCambio.objects.filter(articulo=a, accion="vender").exists()


def test_vender_auto_ya_vendido_u_oculto_409(colaborador):
    for e in (EstadoArticulo.VENDIDO, EstadoArticulo.OCULTO):
        r = colaborador.post(f"{URL}{crear_auto(estado=e).id}/vender/")
        assert r.status_code == 409
        assert r.json()["detalle"] == "Este artículo no está a la venta."


def test_vender_repuesto(colaborador):
    r = crear_repuesto(cantidad=3)
    resp = colaborador.post(f"{URL}{r.id}/vender/", {"cantidad": 2}, format="json")
    assert resp.status_code == 201, resp.json()
    r.repuesto.refresh_from_db()
    assert r.repuesto.cantidad == 1
    assert resp.json()["articulo"]["cantidad"] == 1


def test_vender_mas_de_lo_que_hay_409(colaborador):
    r = crear_repuesto(cantidad=3)
    resp = colaborador.post(f"{URL}{r.id}/vender/", {"cantidad": 4}, format="json")
    assert resp.status_code == 409
    assert resp.json()["detalle"] == "Solo quedan 3."
    r.repuesto.refresh_from_db()
    assert r.repuesto.cantidad == 3


def test_vender_cantidad_cero_400(colaborador):
    r = crear_repuesto(cantidad=3)
    assert (
        colaborador.post(f"{URL}{r.id}/vender/", {"cantidad": 0}, format="json").status_code == 400
    )


def test_deshacer_venta_de_auto(colaborador):
    a = crear_auto()
    colaborador.post(f"{URL}{a.id}/vender/")
    r = colaborador.post(f"{URL}{a.id}/deshacer-venta/")
    assert r.status_code == 200, r.json()
    a.refresh_from_db()
    assert a.estado == EstadoArticulo.DISPONIBLE
    assert not Venta.objects.filter(articulo=a).exists()
    assert HistorialCambio.objects.filter(articulo=a, accion="deshacer_venta").exists()


def test_deshacer_venta_de_repuesto(colaborador):
    r = crear_repuesto(cantidad=3)
    colaborador.post(f"{URL}{r.id}/vender/", {"cantidad": 2}, format="json")
    colaborador.post(f"{URL}{r.id}/deshacer-venta/")
    r.repuesto.refresh_from_db()
    assert r.repuesto.cantidad == 3


def test_deshacer_sin_ventas_409(colaborador):
    r = colaborador.post(f"{URL}{crear_auto().id}/deshacer-venta/")
    assert r.status_code == 409
    assert r.json()["detalle"] == "No hay ventas para deshacer."
