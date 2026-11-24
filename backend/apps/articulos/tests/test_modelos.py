import pytest
from django.db import DataError, IntegrityError, transaction
from django.db.models import F

from apps.articulos.models import Compatibilidad, Foto, Repuesto
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, modelo

# La restricción es diferida: solo se revisa al confirmar una transacción real.
TRANSACCION_REAL = pytest.mark.django_db(transaction=True, serialized_rollback=True)


def test_precio_anterior_debe_ser_mayor(db):
    assert crear_auto(precio_anterior_colones=None).precio_anterior_colones is None
    assert crear_auto(precio_anterior_colones=7_200_000).precio_anterior_colones == 7_200_000
    with pytest.raises(IntegrityError), transaction.atomic():
        crear_auto(precio_anterior_colones=6_500_000)
    with pytest.raises(IntegrityError), transaction.atomic():
        crear_auto(precio_anterior_colones=6_000_000)


def test_cantidad_no_negativa(db):
    r = crear_repuesto(cantidad=1)
    with pytest.raises((IntegrityError, DataError)), transaction.atomic():
        Repuesto.objects.filter(pk=r.pk).update(cantidad=F("cantidad") - 5)


def test_compatibilidad_rango(db):
    r = crear_repuesto()
    Compatibilidad.objects.create(
        repuesto=r.repuesto, modelo=modelo(), anio_desde=2012, anio_hasta=2016
    )
    with pytest.raises(IntegrityError), transaction.atomic():
        Compatibilidad.objects.create(
            repuesto=r.repuesto, modelo=modelo(), anio_desde=2016, anio_hasta=2012
        )


def test_placa_un_digito(db):
    assert crear_auto(placa_termina_en=3).auto.placa_termina_en == 3
    with pytest.raises(IntegrityError), transaction.atomic():
        crear_auto(placa_termina_en=10)


def test_anio_minimo(db):
    with pytest.raises(IntegrityError), transaction.atomic():
        crear_auto(anio=1949)


def test_foto_principal_es_orden_1(db):
    a = crear_auto()
    assert a.foto_principal is None
    Foto.objects.create(articulo=a, public_id="x/2", ancho=800, alto=600, orden=2)
    primera = Foto.objects.create(articulo=a, public_id="x/1", ancho=800, alto=600, orden=1)
    assert a.foto_principal == primera
    assert list(a.fotos.values_list("orden", flat=True)) == [1, 2]


def test_agotado_solo_repuestos_en_cero(db):
    assert crear_repuesto(cantidad=0).agotado is True
    assert crear_repuesto(cantidad=2).agotado is False
    assert crear_auto().agotado is False


@TRANSACCION_REAL
def test_intercambiar_orden_de_fotos_en_transaccion():
    a = crear_auto()
    f1 = Foto.objects.create(articulo=a, public_id="x/1", ancho=800, alto=600, orden=1)
    f2 = Foto.objects.create(articulo=a, public_id="x/2", ancho=800, alto=600, orden=2)
    with transaction.atomic():
        Foto.objects.filter(pk=f1.pk).update(orden=2)
        Foto.objects.filter(pk=f2.pk).update(orden=1)
    assert a.foto_principal.pk == f2.pk


@TRANSACCION_REAL
def test_dos_fotos_orden_1_falla_al_confirmar():
    a = crear_auto()
    Foto.objects.create(articulo=a, public_id="x/1", ancho=800, alto=600, orden=1)
    with pytest.raises(IntegrityError), transaction.atomic():
        Foto.objects.create(articulo=a, public_id="x/2", ancho=800, alto=600, orden=1)


def test_foto_orden_positivo(db):
    a = crear_auto()
    with pytest.raises(IntegrityError), transaction.atomic():
        Foto.objects.create(articulo=a, public_id="x/0", ancho=800, alto=600, orden=0)


def test_equipamiento_del_auto(db):
    from apps.catalogos.models import Equipamiento

    a = crear_auto()
    aire = Equipamiento.objects.get(nombre="Aire acondicionado")
    a.auto.equipamiento.add(aire)
    assert list(a.auto.equipamiento.all()) == [aire]


def test_repuesto_no_puede_quedar_vendido(db):
    from apps.articulos.models import Articulo

    r = crear_repuesto()
    with pytest.raises(IntegrityError), transaction.atomic():
        Articulo.objects.filter(pk=r.pk).update(estado="vendido")


def test_estado_invalido_rechazado(db):
    from apps.articulos.models import Articulo

    a = crear_auto()
    with pytest.raises(IntegrityError), transaction.atomic():
        Articulo.objects.filter(pk=a.pk).update(estado="perdido")


def test_condicion_invalida_rechazada(db):
    r = crear_repuesto()
    with pytest.raises(IntegrityError), transaction.atomic():
        Repuesto.objects.filter(pk=r.pk).update(condicion="rota")
