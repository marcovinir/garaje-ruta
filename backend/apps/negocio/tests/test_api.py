from datetime import timedelta
from decimal import Decimal

from django.utils import timezone
from rest_framework.test import APIClient

from apps.actividad.models import TipoCambio


def test_configuracion_publica(db):
    datos = APIClient().get("/api/v1/configuracion/").json()
    assert datos["nombre"] == "Garaje Ruta"
    assert datos["whatsapp"] == "50600000000"
    assert len(datos["horarios"]) == 6
    assert datos["horarios"][0] == {"dia_semana": 0, "apertura": "08:00", "cierre": "17:00"}


def test_tipo_cambio_vigente(db):
    hoy = timezone.localdate()
    TipoCambio.objects.create(
        fecha=hoy, compra=Decimal("442.25"), venta=Decimal("448.25"), fuente="x"
    )
    datos = APIClient().get("/api/v1/tipo-cambio/").json()
    assert datos == {
        "fecha": str(hoy),
        "compra": "442.25",
        "venta": "448.25",
        "fuente": "x",
        "desactualizado": False,
    }


def test_tipo_cambio_desactualizado(db):
    viejo = timezone.localdate() - timedelta(days=4)
    TipoCambio.objects.create(fecha=viejo, compra=Decimal("440"), venta=Decimal("446"), fuente="x")
    assert APIClient().get("/api/v1/tipo-cambio/").json()["desactualizado"] is True


def test_sin_tipo_cambio_404(db):
    r = APIClient().get("/api/v1/tipo-cambio/")
    assert r.status_code == 404
    assert r.json()["detalle"] == "Aún no hay tipo de cambio."
