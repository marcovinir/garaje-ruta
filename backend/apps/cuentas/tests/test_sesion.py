import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.cuentas.models import Usuario

CLAVE = "Clave-Segura-2026"
MENSAJE = "Correo o contraseña incorrectos."


@pytest.fixture(autouse=True)
def _sin_throttle():
    cache.clear()


@pytest.fixture
def cliente():
    c = APIClient(enforce_csrf_checks=True)
    r = c.get("/api/v1/auth/csrf/")
    assert r.status_code == 204
    c.credentials(HTTP_X_CSRFTOKEN=c.cookies["csrftoken"].value)
    return c


@pytest.fixture
def admin(db):
    return Usuario.objects.crear_usuario(
        "admin@garajeruta.test", "Ana", "Mora", "admin", password=CLAVE, activo=True
    )


def login(c, email, password=CLAVE):
    return c.post("/api/v1/auth/login/", {"email": email, "password": password}, format="json")


def test_login_correcto_devuelve_usuario_y_permisos(cliente, admin):
    r = login(cliente, "admin@garajeruta.test")
    assert r.status_code == 200
    assert r.json()["email"] == "admin@garajeruta.test"
    assert r.json()["rol"] == "admin"
    assert "reportes.ver" in r.json()["permisos"]
    assert r.json()["permisos"] == sorted(r.json()["permisos"])
    assert set(r.json()) == {"id", "email", "nombre", "apellidos", "rol", "permisos"}


def test_login_normaliza_email(cliente, admin):
    assert login(cliente, " Admin@GarajeRuta.TEST ").status_code == 200


def test_login_clave_incorrecta_mensaje_generico(cliente, admin):
    r = login(cliente, "admin@garajeruta.test", "otra-clave")
    assert r.status_code == 400
    assert r.json() == {"detalle": MENSAJE, "campos": {}}


def test_login_usuario_inexistente_mismo_mensaje(cliente, db):
    r = login(cliente, "nadie@garajeruta.test")
    assert r.status_code == 400
    assert r.json() == {"detalle": MENSAJE, "campos": {}}


def test_login_usuario_inactivo_mismo_mensaje(cliente, db):
    Usuario.objects.crear_usuario("ina@x.test", "I", "N", "colaborador", password=CLAVE)
    r = login(cliente, "ina@x.test")
    assert r.status_code == 400
    assert r.json() == {"detalle": MENSAJE, "campos": {}}


def test_login_sin_csrf_rechazado(admin):
    c = APIClient(enforce_csrf_checks=True)
    assert login(c, "admin@garajeruta.test").status_code == 403


def test_yo_anonimo_403(cliente, db):
    assert cliente.get("/api/v1/auth/yo/").status_code == 403


def test_yo_devuelve_usuario_logueado(cliente, admin):
    login(cliente, "admin@garajeruta.test")
    r = cliente.get("/api/v1/auth/yo/")
    assert r.status_code == 200
    assert r.json()["id"] == admin.id


def test_logout_cierra_sesion(cliente, admin):
    login(cliente, "admin@garajeruta.test")
    cliente.credentials(HTTP_X_CSRFTOKEN=cliente.cookies["csrftoken"].value)
    assert cliente.post("/api/v1/auth/logout/").status_code == 204
    assert cliente.get("/api/v1/auth/yo/").status_code == 403


def test_yo_devuelve_permisos_del_colaborador(cliente, db):
    Usuario.objects.crear_usuario(
        "colab@x.test", "Carlos", "Rojas", "colaborador", password=CLAVE, activo=True
    )
    login(cliente, "colab@x.test")
    permisos = cliente.get("/api/v1/auth/yo/").json()["permisos"]
    assert "articulos.crear" in permisos
    assert "usuarios.gestionar" not in permisos
