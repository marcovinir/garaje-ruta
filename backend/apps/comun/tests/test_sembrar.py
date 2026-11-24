from io import StringIO

from django.contrib.auth import authenticate
from django.core.management import call_command
from django.db.models import Sum

from apps.actividad.models import HistorialCambio, TipoCambio, Venta, VistaDiaria
from apps.articulos.models import (
    Articulo,
    Auto,
    Compatibilidad,
    EstadoArticulo,
    Foto,
    Repuesto,
    TipoArticulo,
)
from apps.cuentas.models import Usuario


def sembrar(*args) -> str:
    salida = StringIO()
    call_command("sembrar", *args, stdout=salida)
    return salida.getvalue()


def test_sembrar_crea_datos(db):
    salida = sembrar()
    assert Articulo.objects.filter(tipo=TipoArticulo.AUTO).count() == 40
    assert Articulo.objects.filter(tipo=TipoArticulo.REPUESTO).count() == 80
    assert set(Usuario.objects.values_list("email", flat=True)) == {
        "admin@garajeruta.test",
        "colaborador@garajeruta.test",
        "demo@garajeruta.test",
    }
    assert authenticate(email="admin@garajeruta.test", password="Demo-Garaje-2026")
    assert authenticate(email="demo@garajeruta.test", password="Demo-Garaje-2026")
    assert TipoCambio.objects.count() == 60
    assert VistaDiaria.objects.exists()
    assert "40 autos" in salida and "80 repuestos" in salida


def test_sembrar_estados_destacados_y_ofertas(db):
    sembrar()
    autos = Articulo.objects.filter(tipo=TipoArticulo.AUTO)
    assert autos.filter(estado=EstadoArticulo.VENDIDO).count() == 4
    assert autos.filter(estado=EstadoArticulo.RESERVADO).count() == 2
    assert Articulo.objects.filter(destacado=True).count() == 6
    assert Articulo.objects.filter(precio_anterior_colones__isnull=False).exists()
    assert Repuesto.objects.filter(cantidad=0).count() == 10
    assert Auto.objects.filter(equipamiento__isnull=False).distinct().count() == 40


def test_sembrar_datos_coherentes(db):
    sembrar()
    for articulo in Articulo.objects.all():
        es_auto = articulo.tipo == TipoArticulo.AUTO
        assert Auto.objects.filter(articulo=articulo).exists() == es_auto
        assert Repuesto.objects.filter(articulo=articulo).exists() == (not es_auto)
        assert Foto.objects.filter(articulo=articulo, orden=1).exists()
    assert not any(c.anio_desde > c.anio_hasta for c in Compatibilidad.objects.all())
    for auto in Articulo.objects.filter(estado=EstadoArticulo.VENDIDO):
        assert Venta.objects.filter(articulo=auto).count() == 1
    for repuesto in Repuesto.objects.all():
        vendidas = repuesto.articulo.ventas.aggregate(t=Sum("cantidad"))["t"] or 0
        assert repuesto.cantidad + vendidas >= 1
        assert repuesto.compatibilidades.exists()
    for auto in Auto.objects.filter(combustible__nombre="Eléctrico"):
        assert auto.cilindrada_cc is None
    assert HistorialCambio.objects.filter(accion="crear").count() == 120
    assert HistorialCambio.objects.filter(accion="vender").count() == Venta.objects.count()


def test_sembrar_dos_veces_no_duplica(db):
    sembrar()
    salida = sembrar()
    assert Articulo.objects.count() == 120
    assert "ya hay datos" in salida.lower()


def test_sembrar_reiniciar_regenera(db):
    sembrar()
    admin_id = Usuario.objects.get(email="admin@garajeruta.test").id
    ventas = Venta.objects.count()
    sembrar("--reiniciar")
    assert Articulo.objects.count() == 120
    assert Venta.objects.count() == ventas
    assert Usuario.objects.get(email="admin@garajeruta.test").id == admin_id
    assert Usuario.objects.count() == 3
