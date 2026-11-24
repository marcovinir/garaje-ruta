"""Toda ruta del panel exige un permiso del sistema y el usuario demo no puede escribir."""

import pytest
from django.urls import URLPattern, URLResolver, get_resolver

from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario

METODOS_ESCRITURA = ("post", "put", "patch", "delete")


def _recorrer(patrones, prefijo=""):
    for p in patrones:
        if isinstance(p, URLResolver):
            yield from _recorrer(p.url_patterns, prefijo + str(p.pattern))
        elif isinstance(p, URLPattern):
            yield prefijo + str(p.pattern), p.callback


def rutas_panel() -> list[tuple[str, object]]:
    return [
        (r, v) for r, v in _recorrer(get_resolver().url_patterns) if r.startswith("api/v1/panel/")
    ]


def _clase_vista(callback):
    return getattr(callback, "cls", None) or getattr(callback, "view_class", None)


def _url_de_prueba(ruta: str) -> str:
    import re

    ruta = re.sub(r"\(\?P<[^>]+>[^)]*\)", "1", ruta)
    ruta = re.sub(r"<[^>]+>", "1", ruta)
    return "/" + ruta.replace("^", "").replace("$", "").replace(r"\.", ".")


def test_hay_rutas_de_panel():
    assert rutas_panel()


@pytest.mark.parametrize("ruta,callback", rutas_panel(), ids=[r for r, _ in rutas_panel()])
def test_toda_vista_del_panel_exige_un_permiso_del_sistema(ruta, callback):
    clase = _clase_vista(callback)
    assert clase is not None, ruta
    nombres = [p.__name__ for p in clase.permission_classes]
    assert any(n.startswith("TieneAlguno") for n in nombres), (ruta, nombres)


@pytest.mark.parametrize("ruta,callback", rutas_panel(), ids=[r for r, _ in rutas_panel()])
def test_demo_no_escribe_en_el_panel(db, ruta, callback):
    demo = Usuario.objects.crear_usuario(
        "demo@x.test", "D", "X", "demo", password="Clave-Segura-2026", activo=True
    )
    cliente = cliente_de(demo)
    acciones = getattr(callback, "actions", None)
    clase = _clase_vista(callback)
    if acciones:
        metodos = [m for m in acciones if m in METODOS_ESCRITURA]
    else:
        metodos = [m for m in METODOS_ESCRITURA if hasattr(clase, m)]
    # Un método deshabilitado (405) no es una fuga de permisos: solo se prueban los aceptados.
    metodos = [m for m in metodos if m in getattr(clase, "http_method_names", METODOS_ESCRITURA)]
    for metodo in metodos:
        r = getattr(cliente, metodo)(_url_de_prueba(ruta), {}, format="json")
        assert r.status_code == 403, (metodo, ruta, r.status_code)
