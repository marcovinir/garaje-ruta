import pytest

from apps.articulos.tests.fabricas import crear_auto
from apps.comun.pruebas import cliente_de
from apps.comun.revalidacion import RevalidadorHttp, RevalidadorMemoria
from apps.cuentas.models import Usuario


@pytest.fixture(autouse=True)
def _limpio():
    RevalidadorMemoria.limpiar()
    yield
    RevalidadorMemoria.limpiar()


@pytest.fixture
def admin(db):
    return cliente_de(
        Usuario.objects.crear_usuario(
            "a@x.test", "A", "X", "admin", password="Clave-Segura-2026", activo=True
        )
    )


def test_vender_revalida_tras_el_commit(admin, django_capture_on_commit_callbacks):
    a = crear_auto()
    with django_capture_on_commit_callbacks(execute=False) as callbacks:
        admin.post(f"/api/v1/panel/articulos/{a.id}/vender/")
        assert RevalidadorMemoria.llamadas == []
    for callback in callbacks:
        callback()
    assert RevalidadorMemoria.llamadas == [["articulos", f"articulo-{a.id}"]]


def test_venta_fallida_no_revalida(admin, django_capture_on_commit_callbacks):
    a = crear_auto(estado="oculto")
    with django_capture_on_commit_callbacks(execute=True):
        assert admin.post(f"/api/v1/panel/articulos/{a.id}/vender/").status_code == 409
    assert RevalidadorMemoria.llamadas == []


@pytest.mark.parametrize(
    "accion",
    ["editar", "estado", "duplicar", "eliminar"],
)
def test_escrituras_de_articulo_revalidan(admin, django_capture_on_commit_callbacks, accion):
    a = crear_auto()
    base = f"/api/v1/panel/articulos/{a.id}/"
    with django_capture_on_commit_callbacks(execute=True):
        if accion == "editar":
            admin.patch(base, {"precio_colones": 6_000_000}, format="json")
        elif accion == "estado":
            admin.post(f"{base}estado/", {"estado": "reservado"}, format="json")
        elif accion == "duplicar":
            admin.post(f"{base}duplicar/")
        else:
            admin.delete(base)
    if accion == "duplicar":
        assert any(
            c[0] == "articulos" and c != ["articulos", f"articulo-{a.id}"]
            for c in RevalidadorMemoria.llamadas
        )
    else:
        assert ["articulos", f"articulo-{a.id}"] in RevalidadorMemoria.llamadas


def test_configuracion_revalida(admin, django_capture_on_commit_callbacks):
    datos = {
        "nombre": "Garaje Ruta",
        "whatsapp": "50688887777",
        "direccion": "Heredia",
        "horarios": [],
    }
    with django_capture_on_commit_callbacks(execute=True):
        admin.put("/api/v1/panel/configuracion/", datos, format="json")
    assert RevalidadorMemoria.llamadas == [["configuracion"]]


def test_catalogo_revalida(admin, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        admin.post("/api/v1/panel/marcas/", {"nombre": "Geely"}, format="json")
    assert RevalidadorMemoria.llamadas == [["catalogos", "articulos"]]


class Respuesta:
    status_code = 200


def test_http_envia_url_header_y_json(monkeypatch, settings):
    settings.REVALIDACION_SECRETO = "s3cr3t"
    settings.FRONTEND_URL = "https://garajeruta.test"
    enviado = {}

    def falso_post(url, json, headers, timeout):
        enviado.update(url=url, json=json, headers=headers, timeout=timeout)
        return Respuesta()

    monkeypatch.setattr("apps.comun.revalidacion.requests.post", falso_post)
    RevalidadorHttp().revalidar(["articulos", "articulo-5"])
    assert enviado == {
        "url": "https://garajeruta.test/api/revalidar",
        "json": {"etiquetas": ["articulos", "articulo-5"]},
        "headers": {"Authorization": "Bearer s3cr3t"},
        "timeout": 5,
    }


def test_http_no_propaga_errores_de_red(monkeypatch, settings):
    import requests

    settings.REVALIDACION_SECRETO = "s3cr3t"

    def falla(*args, **kwargs):
        raise requests.ConnectionError("sin red")

    monkeypatch.setattr("apps.comun.revalidacion.requests.post", falla)
    RevalidadorHttp().revalidar(["articulos"])


def test_http_sin_secreto_no_llama(monkeypatch, settings):
    settings.REVALIDACION_SECRETO = ""

    def no_debe_llamarse(*args, **kwargs):
        raise AssertionError("no debía llamar")

    monkeypatch.setattr("apps.comun.revalidacion.requests.post", no_debe_llamarse)
    RevalidadorHttp().revalidar(["articulos"])


def test_http_recorta_el_secreto_pegado_con_salto_de_linea(monkeypatch, settings):
    """Un secreto pegado con «\n» al final rompía el encabezado y el aviso fallaba en silencio."""
    settings.REVALIDACION_SECRETO = "s3cr3t\n"
    settings.FRONTEND_URL = "https://garajeruta.test"
    enviado = {}

    def falso_post(url, json, headers, timeout):
        enviado.update(headers=headers)
        return Respuesta()

    monkeypatch.setattr("apps.comun.revalidacion.requests.post", falso_post)
    RevalidadorHttp().revalidar(["articulos"])
    assert enviado["headers"] == {"Authorization": "Bearer s3cr3t"}
