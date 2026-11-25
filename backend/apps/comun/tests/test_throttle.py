"""Next pide los datos desde su servidor: sus peticiones no deben agotar el límite por IP."""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def limite_bajo(settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {
            **settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],
            "publico": "2/min",
        },
    }
    settings.SERVIDOR_NEXT_SECRETO = "s3cr3t"


def test_visitante_anonimo_tiene_limite(db, limite_bajo):
    c = APIClient()
    codigos = [c.get("/api/v1/configuracion/").status_code for _ in range(3)]
    assert codigos == [200, 200, 429]


def test_servidor_de_next_con_secreto_no_tiene_limite(db, limite_bajo):
    c = APIClient(HTTP_X_SERVIDOR_NEXT="s3cr3t")
    assert {c.get("/api/v1/configuracion/").status_code for _ in range(5)} == {200}


def test_secreto_incorrecto_si_tiene_limite(db, limite_bajo):
    c = APIClient(HTTP_X_SERVIDOR_NEXT="otro")
    assert [c.get("/api/v1/configuracion/").status_code for _ in range(3)][-1] == 429


def test_sin_secreto_configurado_nadie_se_salta_el_limite(db, limite_bajo, settings):
    settings.SERVIDOR_NEXT_SECRETO = ""
    c = APIClient(HTTP_X_SERVIDOR_NEXT="")
    assert [c.get("/api/v1/configuracion/").status_code for _ in range(3)][-1] == 429


def test_login_no_se_evade_cambiando_x_forwarded_for(db, settings):
    # En producción Vercel agrega la IP real al final: con NUM_PROXIES=1 DRF cuenta esa, no
    # lo que el cliente escriba antes en el encabezado.
    from django.core.cache import cache

    cache.clear()
    settings.REST_FRAMEWORK = {**settings.REST_FRAMEWORK, "NUM_PROXIES": 1}
    c = APIClient()
    codigos = [
        c.post(
            "/api/v1/auth/login/",
            {"email": "nadie@x.test", "password": "mala"},
            HTTP_X_FORWARDED_FOR=f"9.9.9.{n}, 1.2.3.4",
        ).status_code
        for n in range(11)
    ]
    assert codigos[-1] == 429
