"""Si el servidor de correo falla, la API responde 503 con un mensaje claro (no un 500 en HTML)
y «recuperar» no revela si el correo existe."""

import smtplib

import pytest
from django.core.mail import EmailMultiAlternatives
from rest_framework.test import APIClient

from apps.comun.pruebas import cliente_de, crear_admin
from apps.cuentas.models import Usuario

NO_SE_PUDO = "No pudimos enviar el correo. Probá de nuevo en unos minutos."


@pytest.fixture(autouse=True, params=[smtplib.SMTPException, ConnectionError, TimeoutError])
def _smtp_caido(settings, monkeypatch, request):
    settings.NOTIFICADOR = "apps.comun.notificaciones.NotificadorCorreo"

    def falla_de_envio(self, *, fail_silently):
        assert fail_silently is False
        raise request.param("Servidor de correo caído")

    monkeypatch.setattr(EmailMultiAlternatives, "send", falla_de_envio)


def test_crear_usuario_con_smtp_caido_da_503_y_no_lo_crea(db):
    admin = cliente_de(crear_admin())
    r = admin.post(
        "/api/v1/panel/usuarios/",
        {"email": "nuevo@x.test", "nombre": "N", "apellidos": "X", "rol": "colaborador"},
        format="json",
    )
    assert r.status_code == 503
    assert r.json() == {"detalle": NO_SE_PUDO, "campos": {}}
    assert not Usuario.objects.filter(email="nuevo@x.test").exists()


def test_reenviar_invitacion_con_smtp_caido_da_503(db):
    yo = crear_admin()
    pendiente = Usuario.objects.crear_usuario("p@x.test", "P", "X", "colaborador")
    r = cliente_de(yo).post(f"/api/v1/panel/usuarios/{pendiente.id}/reenviar-activacion/")
    assert r.status_code == 503
    assert r.json()["detalle"] == NO_SE_PUDO


def test_recuperar_con_smtp_caido_responde_204_igual(db):
    Usuario.objects.crear_usuario(
        "existe@x.test", "E", "X", "colaborador", password="Clave-Segura-2026", activo=True
    )
    c = APIClient()
    assert c.post("/api/v1/auth/recuperar/", {"email": "existe@x.test"}).status_code == 204
    assert c.post("/api/v1/auth/recuperar/", {"email": "nadie@x.test"}).status_code == 204
