from apps.actividad.models import AccionHistorial, HistorialCambio
from apps.articulos.tests.fabricas import crear_auto, usuario_admin
from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario

URL = "/api/v1/panel/historial/"


def test_historial_filtrado(db):
    a = crear_auto()
    b = crear_auto()
    yo = usuario_admin()
    HistorialCambio.objects.create(articulo=a, usuario=yo, accion=AccionHistorial.CREAR)
    HistorialCambio.objects.create(
        articulo=a, usuario=yo, accion=AccionHistorial.EDITAR, detalle={"precio_colones": [1, 2]}
    )
    HistorialCambio.objects.create(articulo=b, usuario=yo, accion=AccionHistorial.CREAR)
    demo = Usuario.objects.crear_usuario(
        "d@x.test", "D", "X", "demo", password="Clave-Segura-2026", activo=True
    )
    c = cliente_de(demo)
    assert c.get(URL).json()["count"] == 3
    datos = c.get(f"{URL}?articulo={a.id}").json()
    assert datos["count"] == 2
    primero = datos["results"][0]
    assert primero["accion"] == "editar"
    assert primero["accion_texto"] == "Editó"
    assert primero["detalle"] == {"precio_colones": [1, 2]}
    assert primero["usuario"]["nombre"] == "Fábrica Pruebas"
    assert primero["articulo"] == {"id": a.id, "titulo": "Toyota Corolla 2015"}
    assert c.get(f"{URL}?accion=crear").json()["count"] == 2
