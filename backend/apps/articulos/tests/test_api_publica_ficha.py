from rest_framework.test import APIClient

from apps.actividad.models import VistaDiaria
from apps.articulos.models import Compatibilidad, EstadoArticulo
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, modelo
from apps.catalogos.models import Equipamiento


def ficha(articulo_id):
    return APIClient().get(f"/api/v1/articulos/{articulo_id}/")


def test_ficha_de_auto_disponible(db):
    a = crear_auto(placa_termina_en=3)
    a.auto.equipamiento.add(
        Equipamiento.objects.get(nombre="Aire acondicionado"),
        Equipamiento.objects.get(nombre="Bluetooth"),
    )
    datos = ficha(a.id).json()
    assert datos["estado_publico"] == "disponible"
    assert datos["titulo"] == "Toyota Corolla 2015"
    assert datos["ruta"] == f"/autos/toyota-corolla-2015-{a.id}"
    auto = datos["auto"]
    assert auto["marca"] == "Toyota" and auto["modelo"] == "Corolla"
    assert auto["placa_termina_en"] == 3
    assert auto["estado_general"] == "muy_bueno"
    assert auto["equipamiento"] == [
        {"grupo": "Confort", "items": ["Aire acondicionado"]},
        {"grupo": "Tecnología", "items": ["Bluetooth"]},
    ]
    assert datos["fotos"] == []
    assert datos["vistas_total"] == 0


def test_ficha_de_repuesto(db):
    r = crear_repuesto(cantidad=2, numero_parte="27060-0D010")
    Compatibilidad.objects.create(
        repuesto=r.repuesto, modelo=modelo("Toyota", "Corolla"), anio_desde=2012, anio_hasta=2016
    )
    datos = ficha(r.id).json()
    rep = datos["repuesto"]
    assert rep["cantidad"] == 2
    assert rep["numero_parte"] == "27060-0D010"
    assert rep["compatibilidades"] == [
        {
            "marca": "Toyota",
            "modelo": "Corolla",
            "anio_desde": 2012,
            "anio_hasta": 2016,
            "motor_version": None,
        }
    ]
    assert rep["categoria"] == {"nombre": "Sistema eléctrico", "padre": None}


def test_ficha_reservado_completa(db):
    a = crear_auto(estado=EstadoArticulo.RESERVADO)
    datos = ficha(a.id).json()
    assert datos["estado_publico"] == "reservado"
    assert "auto" in datos


def test_ficha_vendido_y_agotado_solo_lo_minimo(db):
    vendido = crear_auto(estado=EstadoArticulo.VENDIDO)
    assert ficha(vendido.id).json() == {
        "id": vendido.id,
        "tipo": "auto",
        "estado_publico": "vendido",
        "titulo": "Toyota Corolla 2015",
        "ruta": f"/autos/toyota-corolla-2015-{vendido.id}",
    }
    agotado = crear_repuesto(cantidad=0)
    assert ficha(agotado.id).json()["estado_publico"] == "agotado"
    assert "precio_colones" not in ficha(agotado.id).json()


def test_ficha_oculto_sin_datos(db):
    oculto = crear_auto(estado=EstadoArticulo.OCULTO)
    r = ficha(oculto.id)
    assert r.status_code == 200
    assert r.json() == {"id": oculto.id, "tipo": "auto", "estado_publico": "no_disponible"}


def test_ficha_inexistente_404(db):
    assert ficha(999999).status_code == 404


def test_similares_de_auto_vendido(db):
    corolla = modelo("Toyota", "Corolla")
    original = crear_auto(modelo=corolla, estado=EstadoArticulo.VENDIDO)
    mismo_modelo = [crear_auto(modelo=corolla) for _ in range(2)]
    misma_marca = crear_auto(modelo=modelo("Toyota", "Yaris"))
    crear_auto(modelo=modelo("Kia", "Rio"), precio=20_000_000)
    ids = [t["id"] for t in APIClient().get(f"/api/v1/articulos/{original.id}/similares/").json()]
    assert len(ids) == 3
    assert set(ids[:2]) == {a.id for a in mismo_modelo}
    assert ids[2] == misma_marca.id


def test_similares_de_repuesto(db):
    corolla = modelo("Toyota", "Corolla")
    original = crear_repuesto()
    Compatibilidad.objects.create(
        repuesto=original.repuesto, modelo=corolla, anio_desde=2012, anio_hasta=2016
    )
    compatible = crear_repuesto()
    Compatibilidad.objects.create(
        repuesto=compatible.repuesto, modelo=corolla, anio_desde=2014, anio_hasta=2018
    )
    otro = crear_repuesto()
    Compatibilidad.objects.create(
        repuesto=otro.repuesto, modelo=modelo("Kia", "Rio"), anio_desde=2014, anio_hasta=2018
    )
    ids = [t["id"] for t in APIClient().get(f"/api/v1/articulos/{original.id}/similares/").json()]
    assert ids[0] == compatible.id
    assert original.id not in ids


def test_sitemap_solo_visibles(db):
    visible = crear_auto()
    crear_auto(estado=EstadoArticulo.OCULTO)
    datos = APIClient().get("/api/v1/sitemap/").json()
    assert [d["ruta"] for d in datos] == [f"/autos/toyota-corolla-2015-{visible.id}"]
    assert "actualizado_en" in datos[0]


def test_vistas_suman_en_el_dia(db):
    a = crear_auto()
    cliente = APIClient(enforce_csrf_checks=True)
    assert cliente.post(f"/api/v1/vistas/{a.id}/").status_code == 204
    assert cliente.post(f"/api/v1/vistas/{a.id}/").status_code == 204
    assert VistaDiaria.objects.get(articulo=a).cantidad == 2
    assert ficha(a.id).json()["vistas_total"] == 2


def test_vista_de_oculto_o_inexistente_no_cuenta(db):
    oculto = crear_auto(estado=EstadoArticulo.OCULTO)
    assert APIClient().post(f"/api/v1/vistas/{oculto.id}/").status_code == 204
    assert APIClient().post("/api/v1/vistas/999999/").status_code == 204
    assert not VistaDiaria.objects.exists()


def test_ficha_precarga_relaciones_en_consultas_acotadas(db, django_assert_num_queries):
    cliente = APIClient()
    auto = crear_auto()
    auto.auto.equipamiento.add(*Equipamiento.objects.all()[:5])
    repuesto = crear_repuesto()
    for marca, nombre in [("Toyota", "Corolla"), ("Toyota", "Yaris"), ("Kia", "Rio")]:
        Compatibilidad.objects.create(
            repuesto=repuesto.repuesto,
            modelo=modelo(marca, nombre),
            anio_desde=2012,
            anio_hasta=2016,
        )
    with django_assert_num_queries(6):
        datos_auto = cliente.get(f"/api/v1/articulos/{auto.id}/").json()
    with django_assert_num_queries(5):
        datos_repuesto = cliente.get(f"/api/v1/articulos/{repuesto.id}/").json()
    assert sum(len(g["items"]) for g in datos_auto["auto"]["equipamiento"]) == 5
    assert len(datos_repuesto["repuesto"]["compatibilidades"]) == 3


def test_similares_precarga_tarjetas_en_consultas_acotadas(db, django_assert_num_queries):
    cliente = APIClient()
    corolla = modelo("Toyota", "Corolla")
    auto = crear_auto(modelo=corolla)
    repuesto = crear_repuesto()
    for articulo in [repuesto, *[crear_repuesto() for _ in range(5)]]:
        Compatibilidad.objects.create(
            repuesto=articulo.repuesto, modelo=corolla, anio_desde=2012, anio_hasta=2016
        )
    for _ in range(5):
        crear_auto(modelo=corolla)
    with django_assert_num_queries(4):
        autos = cliente.get(f"/api/v1/articulos/{auto.id}/similares/").json()
    with django_assert_num_queries(6):
        repuestos = cliente.get(f"/api/v1/articulos/{repuesto.id}/similares/").json()
    assert len(autos) == len(repuestos) == 3
    assert all(r["repuesto"]["compatibilidad_resumen"] for r in repuestos)
