from pathlib import Path

import pytest
from django.core.management import call_command

from apps.actividad.models import HistorialCambio
from apps.articulos.fotos import AlmacenFotosMemoria
from apps.articulos.models import Foto
from apps.articulos.tests.fabricas import crear_auto
from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario

URL = "/api/v1/panel/articulos/"


@pytest.fixture(autouse=True)
def _almacen_limpio():
    AlmacenFotosMemoria.limpiar()
    yield
    AlmacenFotosMemoria.limpiar()


@pytest.fixture
def colaborador(db):
    u = Usuario.objects.crear_usuario(
        "c@x.test", "C", "X", "colaborador", password="Clave-Segura-2026", activo=True
    )
    return cliente_de(u)


def foto(n: int, prefijo: str = "garaje-ruta/articulos/") -> dict:
    return {"public_id": f"{prefijo}f{n}", "ancho": 1600, "alto": 1200}


def test_firma_de_subida(colaborador):
    r = colaborador.post("/api/v1/panel/fotos/firma/")
    assert r.status_code == 200
    assert {"cloud_name", "api_key", "timestamp", "folder", "signature"} <= set(r.json())
    assert r.json()["folder"] == "garaje-ruta/articulos"


def test_guardar_y_reordenar(colaborador):
    a = crear_auto()
    r = colaborador.put(f"{URL}{a.id}/fotos/", [foto(1), foto(2), foto(3)], format="json")
    assert r.status_code == 200, r.json()
    assert [f["public_id"] for f in r.json()] == [
        "garaje-ruta/articulos/f1",
        "garaje-ruta/articulos/f2",
        "garaje-ruta/articulos/f3",
    ]
    colaborador.put(f"{URL}{a.id}/fotos/", [foto(3), foto(1), foto(2)], format="json")
    assert a.foto_principal.public_id == "garaje-ruta/articulos/f3"
    assert list(a.fotos.values_list("orden", flat=True)) == [1, 2, 3]
    cambio = HistorialCambio.objects.filter(articulo=a, accion="fotos").first()
    assert cambio.detalle == {"antes": 3, "despues": 3}


def test_maximo_15(colaborador):
    a = crear_auto()
    r = colaborador.put(f"{URL}{a.id}/fotos/", [foto(n) for n in range(16)], format="json")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Máximo 15 fotos por artículo."


def test_prefijo_ajeno_rechazado(colaborador):
    a = crear_auto()
    r = colaborador.put(f"{URL}{a.id}/fotos/", [foto(1, "otra-cuenta/")], format="json")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Foto no válida."


def test_quitar_foto_propia_la_borra_tras_el_commit(
    colaborador, django_capture_on_commit_callbacks
):
    a = crear_auto()
    colaborador.put(f"{URL}{a.id}/fotos/", [foto(1), foto(2)], format="json")
    with django_capture_on_commit_callbacks(execute=True):
        colaborador.put(f"{URL}{a.id}/fotos/", [foto(2)], format="json")
    assert AlmacenFotosMemoria.borradas == ["garaje-ruta/articulos/f1"]


def test_quitar_foto_de_ejemplo_no_la_borra(colaborador, django_capture_on_commit_callbacks):
    a = crear_auto()
    Foto.objects.create(
        articulo=a, public_id="garaje-ruta/ejemplo/auto-01", ancho=1, alto=1, orden=1
    )
    with django_capture_on_commit_callbacks(execute=True):
        colaborador.put(f"{URL}{a.id}/fotos/", [foto(1)], format="json")
    assert AlmacenFotosMemoria.borradas == []


def test_eliminar_articulo_borra_sus_fotos_propias(db, django_capture_on_commit_callbacks):
    admin = Usuario.objects.crear_usuario(
        "a@x.test", "A", "X", "admin", password="Clave-Segura-2026", activo=True
    )
    a = crear_auto()
    Foto.objects.create(articulo=a, public_id="garaje-ruta/articulos/x", ancho=1, alto=1, orden=1)
    Foto.objects.create(
        articulo=a, public_id="garaje-ruta/ejemplo/auto-02", ancho=1, alto=1, orden=2
    )
    with django_capture_on_commit_callbacks(execute=True):
        assert cliente_de(admin).delete(f"{URL}{a.id}/").status_code == 204
    assert AlmacenFotosMemoria.borradas == ["garaje-ruta/articulos/x"]


def test_subir_fotos_ejemplo(db, tmp_path: Path):
    from PIL import Image

    Image.new("RGB", (800, 600), "gray").save(tmp_path / "auto-01.jpg")
    Image.new("RGB", (640, 480), "gray").save(tmp_path / "repuesto-01.png")
    a = crear_auto()
    Foto.objects.create(
        articulo=a, public_id="garaje-ruta/ejemplo/auto-01", ancho=1, alto=1, orden=1
    )
    call_command("subir_fotos_ejemplo", carpeta=str(tmp_path))
    assert sorted(AlmacenFotosMemoria.subidas) == [
        "garaje-ruta/ejemplo/auto-01",
        "garaje-ruta/ejemplo/repuesto-01",
    ]
    f = Foto.objects.get(public_id="garaje-ruta/ejemplo/auto-01")
    assert (f.ancho, f.alto) == (800, 600)


def test_fotos_repetidas_rechazadas(colaborador):
    a = crear_auto()
    r = colaborador.put(f"{URL}{a.id}/fotos/", [foto(1), foto(1)], format="json")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Hay fotos repetidas."


def test_foto_propia_de_otro_articulo_rechazada(colaborador):
    otro, a = crear_auto(), crear_auto()
    colaborador.put(f"{URL}{otro.id}/fotos/", [foto(1)], format="json")
    r = colaborador.put(f"{URL}{a.id}/fotos/", [foto(1)], format="json")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Esa foto ya es de otro artículo."
    assert otro.fotos.get().public_id == "garaje-ruta/articulos/f1"


def test_foto_de_ejemplo_compartida_se_acepta(colaborador):
    otro, a = crear_auto(), crear_auto()
    ejemplo = foto(1, "garaje-ruta/ejemplo/")
    colaborador.put(f"{URL}{otro.id}/fotos/", [ejemplo], format="json")
    r = colaborador.put(f"{URL}{a.id}/fotos/", [ejemplo], format="json")
    assert r.status_code == 200, r.json()
