from datetime import UTC

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


def test_historial_filtra_fecha_local_y_ordena_empates(db, django_assert_num_queries):
    from datetime import datetime

    yo = usuario_admin()
    otro = Usuario.objects.crear_usuario("otro@x.test", "Otro", "X", "demo", activo=True)
    a, b = crear_auto(), crear_auto()
    fechas = [
        datetime(2026, 11, 26, 5, 59, tzinfo=UTC),
        datetime(2026, 11, 26, 6, tzinfo=UTC),
        datetime(2026, 11, 27, 5, 59, tzinfo=UTC),
        datetime(2026, 11, 27, 5, 59, tzinfo=UTC),
        datetime(2026, 11, 27, 6, tzinfo=UTC),
    ]
    filas = [
        HistorialCambio.objects.create(
            articulo=a if n % 2 else b,
            usuario=yo if n % 2 else otro,
            accion=AccionHistorial.CREAR,
            fecha=fecha,
        )
        for n, fecha in enumerate(fechas)
    ]
    c = cliente_de(yo)
    with django_assert_num_queries(5):
        r = c.get(URL, {"desde": "2026-11-26", "hasta": "2026-11-26"})
    assert r.status_code == 200
    assert [fila["id"] for fila in r.json()["results"]] == [f.pk for f in filas[1:4][::-1]]
    assert c.get(URL, {"desde": "2026-02-30", "hasta": "ayer"}).json()["count"] == 5
    assert c.get(URL, {"usuario": otro.id}).json()["count"] == 3
    assert c.get(URL + "usuarios/").json() == [
        {"id": yo.id, "nombre": str(yo)},
        {"id": otro.id, "nombre": str(otro)},
    ]


def test_eliminar_conserva_el_historial_y_guarda_el_titulo(db):
    yo = usuario_admin()
    auto = crear_auto()
    HistorialCambio.objects.create(articulo=auto, usuario=yo, accion=AccionHistorial.CREAR)
    c = cliente_de(yo)
    assert c.delete(f"/api/v1/panel/articulos/{auto.id}/").status_code == 204
    historial = c.get(URL).json()["results"]
    assert [h["accion"] for h in historial] == ["eliminar", "crear"]
    assert all(h["articulo"] == {"id": None, "titulo": auto.titulo} for h in historial)
