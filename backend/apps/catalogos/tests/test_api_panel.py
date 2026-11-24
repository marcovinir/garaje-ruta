import pytest

from apps.articulos.tests.fabricas import crear_auto, modelo
from apps.catalogos.models import CategoriaPieza, Marca
from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario

P = "/api/v1/panel/"


def cliente(rol):
    return cliente_de(
        Usuario.objects.crear_usuario(
            f"{rol}@x.test", "U", "X", rol, password="Clave-Segura-2026", activo=True
        )
    )


@pytest.fixture
def admin(db):
    return cliente("admin")


@pytest.fixture
def colaborador(db):
    return cliente("colaborador")


def test_colaborador_agrega_marca_y_modelo_pero_no_borra(colaborador):
    r = colaborador.post(f"{P}marcas/", {"nombre": "Great Wall"}, format="json")
    assert r.status_code == 201, r.json()
    assert r.json()["slug"] == "great-wall"
    marca = r.json()["id"]
    r = colaborador.post(f"{P}modelos/", {"marca": marca, "nombre": "Poer"}, format="json")
    assert r.status_code == 201, r.json()
    assert colaborador.delete(f"{P}marcas/{marca}/").status_code == 403
    assert (
        colaborador.patch(f"{P}marcas/{marca}/", {"nombre": "GW"}, format="json").status_code == 403
    )


def test_nombre_repetido(admin):
    Marca.objects.create(nombre="Toyota", slug="toyota")
    r = admin.post(f"{P}marcas/", {"nombre": "Toyota"}, format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["nombre"] == ["Ya existe."]


def test_borrar_marca_sin_uso_y_en_uso(admin):
    libre = Marca.objects.create(nombre="Libre", slug="libre")
    assert admin.delete(f"{P}marcas/{libre.id}/").status_code == 204
    usada = modelo("Toyota", "Corolla").marca
    r = admin.delete(f"{P}marcas/{usada.id}/")
    assert r.status_code == 409
    assert r.json()["detalle"] == "Está en uso: no se puede borrar."


def test_borrar_modelo_en_uso_409(admin):
    a = crear_auto()
    assert admin.delete(f"{P}modelos/{a.auto.modelo_id}/").status_code == 409


def test_categoria_maximo_tres_niveles(admin):
    raiz = CategoriaPieza.objects.get(slug="motor")
    r2 = admin.post(f"{P}categorias-pieza/", {"nombre": "Culatas", "padre": raiz.id}, format="json")
    assert r2.status_code == 201, r2.json()
    r3 = admin.post(
        f"{P}categorias-pieza/", {"nombre": "Empaques", "padre": r2.json()["id"]}, format="json"
    )
    assert r3.status_code == 201
    r4 = admin.post(
        f"{P}categorias-pieza/", {"nombre": "Tornillos", "padre": r3.json()["id"]}, format="json"
    )
    assert r4.status_code == 400
    assert r4.json()["campos"]["padre"] == ["Máximo 3 niveles de categorías."]


def test_catalogos_fijos_solo_admin(admin, colaborador):
    assert (
        colaborador.post(f"{P}transmisiones/", {"nombre": "DCT"}, format="json").status_code == 403
    )
    assert admin.post(f"{P}transmisiones/", {"nombre": "DCT"}, format="json").status_code == 201
    r = admin.post(
        f"{P}equipamiento/",
        {"grupo": 1, "nombre": "Cámara de tablero", "filtrable": False},
        format="json",
    )
    assert r.status_code == 201, r.json()
    assert admin.post(f"{P}carrocerias/", {"nombre": "Van"}, format="json").json()["slug"] == "van"


def test_listar_catalogo_con_articulos_ver(colaborador):
    assert colaborador.get(f"{P}combustibles/").status_code == 200
