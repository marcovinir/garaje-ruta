from datetime import date
from decimal import Decimal

from apps.actividad.models import TipoCambio
from apps.articulos.presentacion import id_de_ruta, precio_usd, ruta_publica
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto


def test_ruta_publica_de_auto_y_repuesto(db):
    auto = crear_auto(titulo="Toyota Corolla 2015")
    assert ruta_publica(auto) == f"/autos/toyota-corolla-2015-{auto.id}"
    rep = crear_repuesto(titulo="Cámara 360° Hyundai Tucson")
    assert ruta_publica(rep) == f"/repuestos/camara-360-hyundai-tucson-{rep.id}"


def test_id_de_ruta():
    assert id_de_ruta("toyota-corolla-2015-123") == 123
    assert id_de_ruta("123") == 123
    assert id_de_ruta("abc") is None
    assert id_de_ruta("toyota-corolla-") is None


def test_precio_usd_redondea_a_la_decena():
    tipo = TipoCambio(fecha=date(2026, 11, 24), compra=Decimal("442.25"), venta=Decimal("448.25"))
    assert precio_usd(6_500_000, tipo) == 14_500
    assert precio_usd(45_000, tipo) == 100


def test_precio_usd_sin_tipo_de_cambio():
    assert precio_usd(6_500_000, None) is None
