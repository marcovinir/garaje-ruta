import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.articulos.tests.fabricas import crear_auto

URL = "/api/v1/eventos/"


def test_registra_evento_sin_datos_personales(db):
    from apps.actividad.models import EventoComercial, VistaDiaria

    auto = crear_auto()
    datos = {
        "tipo": "vehicle_view",
        "articulo": auto.pk,
        "dispositivo": "celular",
        "contexto": {"pagina": "ficha_auto", "seccion": "ficha"},
    }
    cliente = APIClient(enforce_csrf_checks=True)
    respuesta = cliente.post(
        URL,
        datos,
        format="json",
        REMOTE_ADDR="192.0.2.31",
        HTTP_USER_AGENT="Agente de prueba",
        HTTP_COOKIE="prueba=valor",
    )
    assert respuesta.status_code == 204
    assert not respuesta.cookies
    evento = EventoComercial.objects.values().get()
    fecha = evento.pop("fecha")
    evento.pop("id")
    assert evento == {
        "tipo": datos["tipo"],
        "articulo_id": auto.pk,
        "dispositivo": datos["dispositivo"],
        "contexto": datos["contexto"],
    }
    assert fecha <= timezone.now()
    assert not VistaDiaria.objects.exists()


@pytest.mark.parametrize(
    "dato",
    [
        {"tipo": "otro"},
        {"dispositivo": "valor libre"},
        {"ip": "192.0.2.31"},
        {"articulo": 99999999999999999999},
        {"contexto": {"pagina": "/buscar?q=texto"}},
        {"contexto": {"ip": "192.0.2.31"}},
        {"contexto": {"filtros": ["marca=1"]}},
        {"contexto": {"filtros": ["marca"] * 90}},
        {"contexto": {"seccion": {"texto": "un contacto"}}},
        {"contexto": ["ofertas"]},
        {"contexto": {"pagina": "a" * 2000}},
    ],
)
def test_rechaza_entradas_fuera_del_contrato(db, dato):
    respuesta = APIClient().post(
        URL, {"tipo": "filter_applied", "dispositivo": "escritorio", **dato}, format="json"
    )
    assert respuesta.status_code == 400


def test_limite_de_eventos_es_independiente_y_sin_identificador(db, settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {
            **settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],
            "eventos": "2/min",
        },
    }
    cliente = APIClient()
    datos = {"tipo": "search_submitted", "dispositivo": "escritorio"}
    assert cliente.post(URL, datos, format="json", REMOTE_ADDR="192.0.2.31").status_code == 204
    assert cliente.post(URL, datos, format="json", REMOTE_ADDR="192.0.2.32").status_code == 204
    assert cliente.post(URL, datos, format="json", REMOTE_ADDR="192.0.2.33").status_code == 429
    assert cliente.get("/api/v1/configuracion/").status_code == 200
