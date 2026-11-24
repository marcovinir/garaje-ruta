from datetime import date
from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from apps.actividad.models import AccionHistorial, HistorialCambio, TipoCambio, Venta, VistaDiaria
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, usuario_admin


def test_venta_cantidad_positiva(db):
    r = crear_repuesto(cantidad=3)
    Venta.objects.create(
        articulo=r, cantidad=1, precio_unitario_colones=45_000, registrada_por=usuario_admin()
    )
    with pytest.raises(IntegrityError), transaction.atomic():
        Venta.objects.create(
            articulo=r, cantidad=0, precio_unitario_colones=45_000, registrada_por=usuario_admin()
        )


def test_articulo_con_ventas_no_se_borra(db):
    a = crear_auto()
    Venta.objects.create(
        articulo=a, cantidad=1, precio_unitario_colones=6_500_000, registrada_por=usuario_admin()
    )
    with pytest.raises(ProtectedError):
        a.delete()


def test_vista_diaria_unica_por_dia(db):
    a = crear_auto()
    VistaDiaria.objects.create(articulo=a, fecha=date(2026, 11, 23), cantidad=4)
    with pytest.raises(IntegrityError), transaction.atomic():
        VistaDiaria.objects.create(articulo=a, fecha=date(2026, 11, 23), cantidad=1)


def test_historial_guarda_detalle_y_ordena_recientes_primero(db):
    a = crear_auto()
    HistorialCambio.objects.create(
        articulo=a, usuario=usuario_admin(), accion=AccionHistorial.CREAR
    )
    HistorialCambio.objects.create(
        articulo=a,
        usuario=usuario_admin(),
        accion=AccionHistorial.CAMBIAR_ESTADO,
        detalle={"antes": "disponible", "despues": "reservado"},
    )
    ultimo = a.historial.first()
    assert ultimo.accion == "cambiar_estado"
    assert ultimo.detalle == {"antes": "disponible", "despues": "reservado"}


def test_tipo_cambio_vigente_es_el_mas_reciente(db):
    TipoCambio.objects.create(
        fecha=date(2026, 11, 20), compra=Decimal("503.10"), venta=Decimal("509.40"), fuente="bccr"
    )
    TipoCambio.objects.create(
        fecha=date(2026, 11, 23), compra=Decimal("504.00"), venta=Decimal("510.25"), fuente="bccr"
    )
    assert TipoCambio.vigente().venta == Decimal("510.25")


def test_tipo_cambio_vigente_none_sin_datos(db):
    assert TipoCambio.vigente() is None


def test_tipo_cambio_positivo(db):
    with pytest.raises(IntegrityError), transaction.atomic():
        TipoCambio.objects.create(
            fecha=date(2026, 11, 23), compra=Decimal("0"), venta=Decimal("510"), fuente="x"
        )
