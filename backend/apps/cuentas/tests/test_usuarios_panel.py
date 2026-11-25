import re

import pytest

from apps.comun.notificaciones import NotificadorMemoria
from apps.comun.pruebas import cliente_de, crear_admin
from apps.cuentas.models import Usuario

URL = "/api/v1/panel/usuarios/"


@pytest.fixture
def yo(db):
    return crear_admin("jefa@x.test")


@pytest.fixture
def admin(yo):
    return cliente_de(yo)


def crear(admin, email="nuevo@x.test", rol="colaborador"):
    return admin.post(
        URL, {"email": email, "nombre": "Nuevo", "apellidos": "Pérez", "rol": rol}, format="json"
    )


def test_crear_colaborador_envia_activacion(admin):
    r = crear(admin)
    assert r.status_code == 201, r.json()
    assert r.json()["is_active"] is False and r.json()["activado"] is False
    assert r.json()["rol"] == "colaborador"
    (envio,) = NotificadorMemoria.enviados
    assert "/panel/activar/" in envio["texto"]


def test_crear_demo(admin):
    assert crear(admin, "otra@x.test", "demo").status_code == 201


def test_correo_duplicado_400(admin):
    crear(admin)
    r = crear(admin, " NUEVO@x.test ")
    assert r.status_code == 400
    assert r.json()["campos"]["email"] == ["Ya existe un usuario con ese correo."]


def test_rol_invalido_400(admin):
    assert crear(admin, rol="jefe").status_code == 400


def test_no_puede_desactivarse_a_si_mismo(admin, yo):
    crear_admin("otro@x.test")
    r = admin.post(f"{URL}{yo.id}/desactivar/")
    assert r.status_code == 400
    assert r.json()["detalle"] == "No podés desactivar tu propia cuenta."


def test_admin_desactiva_a_otro_admin(admin):
    otro = crear_admin("otro2@x.test")
    r = admin.post(f"{URL}{otro.id}/desactivar/")
    assert r.status_code == 200 and r.json()["is_active"] is False


def test_ultimo_admin_activo_no_se_desactiva(db):
    from rest_framework.exceptions import ValidationError

    from apps.cuentas.services import desactivar_usuario

    unico = crear_admin("unico@x.test")
    pendiente = Usuario.objects.crear_usuario("p@x.test", "P", "Q", "admin")  # inactivo
    with pytest.raises(ValidationError) as e:
        desactivar_usuario(unico, hecho_por=pendiente)
    assert "Debe quedar al menos un administrador activo." in str(e.value.detail)


def test_desactivar_invalida_enlace_pendiente(admin):
    crear(admin)
    m = re.search(r"/panel/activar/([^/\s]+)/([^/\s]+)", NotificadorMemoria.enviados[0]["texto"])
    u = Usuario.objects.get(email="nuevo@x.test")
    assert admin.post(f"{URL}{u.id}/desactivar/").status_code == 200
    r = cliente_de().post(
        "/api/v1/auth/activar/",
        {"uid": m.group(1), "token": m.group(2), "password": "Garaje-Nueva-2026"},
        format="json",
    )
    assert r.status_code == 400


def test_reactivar_usuario_activado(admin):
    u = Usuario.objects.crear_usuario(
        "act@x.test", "A", "B", "colaborador", password="Clave-Segura-2026", activo=False
    )
    r = admin.post(f"{URL}{u.id}/reactivar/")
    assert r.status_code == 200 and r.json()["is_active"] is True


def test_reactivar_pendiente_reenvia_enlace(admin):
    crear(admin)
    NotificadorMemoria.limpiar()
    u = Usuario.objects.get(email="nuevo@x.test")
    r = admin.post(f"{URL}{u.id}/reactivar/")
    assert r.status_code == 200 and r.json()["is_active"] is False
    assert len(NotificadorMemoria.enviados) == 1


def test_reenviar_activacion_a_usuario_activado_400(admin, yo):
    r = admin.post(f"{URL}{yo.id}/reenviar-activacion/")
    assert r.status_code == 400
    assert r.json()["detalle"] == "Este usuario ya activó su cuenta."


def test_patch_solo_nombre_y_apellidos(admin, yo):
    r = admin.patch(
        f"{URL}{yo.id}/",
        {"nombre": "Ana", "email": "cambio@x.test", "rol": "colaborador"},
        format="json",
    )
    assert r.status_code == 200
    yo.refresh_from_db()
    assert yo.nombre == "Ana" and yo.email == "jefa@x.test" and yo.rol.nombre == "admin"


def test_delete_no_permitido_405(admin, yo):
    assert admin.delete(f"{URL}{yo.id}/").status_code == 405


def _usuario(rol: str, email: str) -> Usuario:
    return Usuario.objects.crear_usuario(
        email, "U", "X", rol, password="Clave-Segura-2026", activo=True
    )


def test_colaborador_no_puede_listar_usuarios(db):
    assert cliente_de(_usuario("colaborador", "c@x.test")).get(URL).status_code == 403


def test_demo_no_puede_crear_usuarios(db):
    r = crear(cliente_de(_usuario("demo", "d@x.test")))
    assert r.status_code == 403
    assert r.json()["detalle"].startswith("No tenés permiso")


def test_busqueda_q_por_correo_y_filtros(admin):
    crear(admin)
    assert admin.get(f"{URL}?q=nuevo@").json()["count"] == 1
    assert admin.get(f"{URL}?rol=colaborador").json()["count"] == 1
    assert admin.get(f"{URL}?activo=true").json()["count"] == 1  # solo la jefa
