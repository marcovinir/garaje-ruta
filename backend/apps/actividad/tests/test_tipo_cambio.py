from datetime import datetime
from decimal import Decimal
from io import StringIO
from zoneinfo import ZoneInfo

import pytest
import time_machine
from django.core.management import CommandError, call_command

from apps.actividad.models import TipoCambio
from apps.actividad.tipo_cambio import OpenErApi, ProveedorTipoCambioFijo, TipoCambioNoDisponible

FIJO = "apps.actividad.tipo_cambio.ProveedorTipoCambioFijo"


class ProveedorQueFalla:
    nombre = "falla"

    def obtener(self):
        raise TipoCambioNoDisponible("caído")


class Respuesta:
    def __init__(self, datos, codigo=200):
        self._datos, self.status_code = datos, codigo

    def json(self):
        return self._datos

    def raise_for_status(self):
        if self.status_code >= 400:
            import requests

            raise requests.HTTPError(str(self.status_code))


def test_open_er_api(monkeypatch):
    datos = {"result": "success", "rates": {"CRC": 447.836011, "USD": 1}}
    llamadas = []

    def falso_get(url, timeout):
        llamadas.append((url, timeout))
        return Respuesta(datos)

    monkeypatch.setattr("apps.actividad.tipo_cambio.requests.get", falso_get)
    assert OpenErApi().obtener() == (Decimal("447.84"), Decimal("447.84"))
    assert llamadas == [("https://open.er-api.com/v6/latest/USD", 10)]


def test_open_er_api_sin_exito(monkeypatch):
    monkeypatch.setattr(
        "apps.actividad.tipo_cambio.requests.get",
        lambda url, timeout: Respuesta({"result": "error", "error-type": "x"}),
    )
    with pytest.raises(TipoCambioNoDisponible):
        OpenErApi().obtener()


def actualizar() -> str:
    salida = StringIO()
    call_command("actualizar_tipo_cambio", stdout=salida)
    return salida.getvalue()


def test_comando_usa_el_primer_proveedor_que_responde(db, settings, monkeypatch):
    settings.TIPO_CAMBIO_PROVEEDORES = [
        "apps.actividad.tests.test_tipo_cambio.ProveedorQueFalla",
        FIJO,
    ]
    salida = actualizar()
    tc = TipoCambio.objects.get()
    assert (tc.compra, tc.venta, tc.fuente) == (Decimal("442.00"), Decimal("448.00"), "fijo")
    assert "compra ₡442.00, venta ₡448.00 (fijo)" in salida


def test_dos_corridas_el_mismo_dia_no_duplican(db, settings):
    settings.TIPO_CAMBIO_PROVEEDORES = [FIJO]
    actualizar()
    actualizar()
    assert TipoCambio.objects.count() == 1


def test_todos_fallan(db, settings):
    settings.TIPO_CAMBIO_PROVEEDORES = ["apps.actividad.tests.test_tipo_cambio.ProveedorQueFalla"]
    with pytest.raises(CommandError):
        actualizar()


def test_guarda_la_fecha_local(db, settings):
    settings.TIPO_CAMBIO_PROVEEDORES = [FIJO]
    noche = datetime(2026, 11, 24, 20, 0, tzinfo=ZoneInfo("America/Costa_Rica"))
    with time_machine.travel(noche, tick=False):
        actualizar()
    assert str(TipoCambio.objects.get().fecha) == "2026-11-24"


def test_proveedor_fijo():
    assert ProveedorTipoCambioFijo().obtener() == (Decimal("442.00"), Decimal("448.00"))
