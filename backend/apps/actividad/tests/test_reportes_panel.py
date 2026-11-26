from datetime import UTC, date, datetime

from apps.actividad.models import EventoComercial, Venta, VistaDiaria
from apps.articulos.models import Articulo
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, usuario_admin
from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario

URL = "/api/v1/panel/reportes/"


def test_reportes_agregan_ventas_vistas_y_consultas(db, django_assert_num_queries):
    auto = crear_auto()
    repuesto = crear_repuesto(cantidad=0)
    yo = usuario_admin()
    fecha = datetime(2026, 11, 26, 16, tzinfo=UTC)
    Articulo.objects.filter(pk=auto.pk).update(publicado_en=fecha.replace(day=16))
    for articulo, cantidad, precio in [(auto, 1, 6_000_000), (repuesto, 2, 45_000)]:
        Venta.objects.create(
            articulo=articulo,
            cantidad=cantidad,
            precio_unitario_colones=precio,
            registrada_por=yo,
            fecha=fecha,
        )
    Venta.objects.create(
        articulo=auto,
        cantidad=1,
        precio_unitario_colones=1,
        registrada_por=yo,
        fecha=datetime(2026, 11, 1, 5, 59, tzinfo=UTC),
    )
    for articulo, dia, cantidad in [
        (auto, 9, 3),
        (auto, 10, 7),
        (repuesto, 9, 8),
    ]:
        VistaDiaria.objects.create(articulo=articulo, fecha=date(2026, 11, dia), cantidad=cantidad)
    for tipo, articulo in [
        ("whatsapp_click", repuesto),
        ("whatsapp_click", repuesto),
        ("whatsapp_click", auto),
        ("whatsapp_click", None),
        ("visit_request", auto),
        ("compatibility_request", repuesto),
    ]:
        evento = EventoComercial.objects.create(tipo=tipo, articulo=articulo, dispositivo="celular")
        EventoComercial.objects.filter(pk=evento.pk).update(fecha=fecha)

    demo = Usuario.objects.crear_usuario("demo@x.test", "Demo", "Prueba", "demo", activo=True)
    cliente = cliente_de(demo)
    with django_assert_num_queries(7):
        r = cliente.get(URL, {"desde": "2026-11-01", "hasta": "2026-11-26"})
    assert r.status_code == 200
    datos = r.json()
    assert datos["ventas_por_mes"] == [
        {
            "mes": "2026-11",
            "auto": {"cantidad": 1, "monto": 6_000_000},
            "repuesto": {"cantidad": 2, "monto": 90_000},
        }
    ]
    assert datos["ventas"] == {"cantidad": 3, "monto": 6_090_000, "dias_promedio": 10.0}
    assert datos["interes"] == {
        "consultas": 4,
        "visitas": 1,
        "compatibilidad": 1,
    }
    assert [(a["id"], a["total"]) for a in datos["mas_vistos"]] == [(auto.id, 10), (repuesto.id, 8)]
    assert [(a["id"], a["total"]) for a in datos["mas_consultados"]] == [
        (repuesto.id, 2),
        (auto.id, 1),
    ]
    assert datos["mas_vistos"][1]["estado"] == "agotado"


def test_reportes_rango_por_defecto_vacio_y_acceso(db, monkeypatch):
    monkeypatch.setattr("django.utils.timezone.localdate", lambda: date(2026, 8, 31))
    cliente = cliente_de(usuario_admin())
    res = cliente.get(URL)
    assert res.status_code == 200
    assert res.json()["desde"] == "2026-02-28"
    assert res.json()["hasta"] == "2026-08-31"
    assert (
        res.json()["ventas_por_mes"]
        == res.json()["mas_vistos"]
        == res.json()["mas_consultados"]
        == []
    )
    assert res.json()["ventas"] == {"cantidad": 0, "monto": 0, "dias_promedio": None}
    assert cliente.get(URL, {"desde": "2026-11-30", "hasta": "2026-11-01"}).status_code == 400
    assert cliente_de().get(URL).status_code == 403
