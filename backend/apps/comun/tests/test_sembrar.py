from datetime import datetime
from io import StringIO
from zoneinfo import ZoneInfo

import pytest
import time_machine
from django.contrib.auth import authenticate
from django.core.management import CommandError, call_command
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
from apps.comun import semillas
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
    assert authenticate(email="admin@garajeruta.test", password="Local-Garaje-2026")
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


def test_clave_del_admin_separada_de_la_del_demo(db, monkeypatch):
    monkeypatch.setenv("SEMILLA_PASSWORD", "Secreta-Del-Admin-2026")
    monkeypatch.setenv("SEMILLA_PASSWORD_DEMO", "Publica-Del-Demo-2026")
    sembrar()
    assert authenticate(email="admin@garajeruta.test", password="Secreta-Del-Admin-2026")
    assert not authenticate(email="admin@garajeruta.test", password="Publica-Del-Demo-2026")
    assert authenticate(email="colaborador@garajeruta.test", password="Secreta-Del-Admin-2026")
    assert authenticate(email="demo@garajeruta.test", password="Publica-Del-Demo-2026")


def test_sin_clave_del_admin_fuera_de_desarrollo_falla(db, monkeypatch, settings):
    settings.SEMILLA_CLAVE_LOCAL_PERMITIDA = False
    monkeypatch.delenv("SEMILLA_PASSWORD", raising=False)
    with pytest.raises(CommandError, match="SEMILLA_PASSWORD"):
        sembrar()
    assert not Articulo.objects.exists()


def test_equipamiento_coherente_con_el_auto(db):
    sembrar()
    for auto in Auto.objects.select_related("carroceria", "combustible", "transmision"):
        nombres = set(auto.equipamiento.values_list("nombre", flat=True))
        if auto.carroceria.slug != "pickup":
            assert "Cobertor de cajón" not in nombres
        if auto.carroceria.slug not in ("pickup", "suv"):
            assert "Estribos" not in nombres
        if auto.combustible.nombre == "Eléctrico":
            assert "Turbo" not in nombres
        if auto.transmision.nombre != "Automática con modo manual":
            assert "Caja de cambios dual" not in nombres
        if auto.anio < 2016:
            assert not nombres & {"Apple CarPlay", "Android Auto", "Cargador inalámbrico"}


def test_anios_posibles_por_modelo(db):
    from apps.comun.semillas import ANIO_MINIMO

    sembrar()
    for auto in Auto.objects.select_related("modelo"):
        assert auto.anio >= ANIO_MINIMO.get(auto.modelo.nombre, 2008), auto


def test_fechas_en_hora_de_costa_rica(db):
    # 20:00 en Costa Rica ya es el día siguiente en UTC.
    noche = datetime(2026, 11, 23, 20, 0, tzinfo=ZoneInfo("America/Costa_Rica"))
    with time_machine.travel(noche, tick=False):
        sembrar()
    assert str(TipoCambio.vigente().fecha) == "2026-11-23"
    assert str(VistaDiaria.objects.latest("fecha").fecha) == "2026-11-23"
    assert not Venta.objects.filter(
        fecha__lt=datetime(2026, 5, 27, tzinfo=ZoneInfo("UTC"))
    ).exists()


def test_tipo_cambio_de_ejemplo_realista(db):
    sembrar()
    for tc in TipoCambio.objects.all():
        assert 440 <= tc.venta <= 460
        assert tc.compra == tc.venta - 6


def test_sembrar_fotos_coinciden_con_el_articulo(db):
    """Cada auto muestra su modelo (y su color) y cada repuesto, su pieza."""
    sembrar()
    assert set(semillas.FOTO_PIEZA) == {p[0] for p in semillas.PIEZAS}
    for auto in Auto.objects.select_related("articulo", "modelo", "carroceria", "combustible"):
        exteriores, color = semillas.FOTOS_MODELO[auto.modelo.nombre]
        fotos = list(auto.articulo.fotos.order_by("orden").values_list("public_id", flat=True))
        assert fotos[0] in exteriores
        assert auto.color_exterior == color
        assert fotos == semillas.fotos_auto(
            auto.modelo.nombre, auto.carroceria.slug, auto.combustible.nombre, auto.anio
        )
        if auto.combustible.nombre == "Eléctrico":
            assert semillas.FOTO_MOTOR not in fotos
    for repuesto in Repuesto.objects.select_related("articulo"):
        pieza = next(p for p in semillas.FOTO_PIEZA if repuesto.articulo.titulo.startswith(p))
        fotos = list(repuesto.articulo.fotos.values_list("public_id", flat=True))
        assert fotos == [semillas.FOTO_PIEZA[pieza]]


def test_revisar_datos_detecta_inconsistencias_sin_escribir(db):
    from django.db import connection
    from django.test.utils import CaptureQueriesContext

    from apps.catalogos.models import Equipamiento, Modelo

    sembrar()
    auto = (
        Auto.objects.select_related("articulo", "modelo__marca")
        .filter(modelo__nombre="Leaf")
        .first()
    )
    auto.articulo.titulo = "Nissan Nissan Leaf"
    auto.articulo.save(update_fields=["titulo"])
    auto.equipamiento.add(Equipamiento.objects.get(nombre="Techo solar o panorámico"))
    auto.articulo.fotos.filter(orden=1).update(public_id=semillas.FOTOS_MODELO["Corolla"][0][0])
    repuesto = Repuesto.objects.first()
    repuesto.articulo.titulo = "Faro delantero derecho Nissan X-Trail"
    repuesto.articulo.save(update_fields=["titulo"])
    repuesto.compatibilidades.all().delete()
    Compatibilidad.objects.create(
        repuesto=repuesto,
        modelo=Modelo.objects.get(nombre="Leaf"),
        anio_desde=2014,
        anio_hasta=2017,
    )
    salida = StringIO()
    with CaptureQueriesContext(connection) as consultas:
        call_command("revisar_datos", stdout=salida)
    informe = salida.getvalue()
    assert "marca repetida" in informe
    assert "modelo del título sin compatibilidad" in informe
    assert "compatibilidad no nombrada" in informe
    assert "equipamiento incompatible: Techo solar o panorámico" in informe
    assert "foto de otro modelo" in informe
    assert not any(
        c["sql"].lstrip().split()[0].upper()
        in {"INSERT", "UPDATE", "DELETE", "ALTER", "CREATE", "DROP"}
        for c in consultas
    )


def test_sembrar_titulos_compatibilidades_e_informe(db):
    sembrar()
    for articulo in Articulo.objects.all():
        assert "Mazda Mazda" not in articulo.titulo
        assert "Revisado por nuestro taller" not in articulo.descripcion
        assert "Probado antes de la venta" not in articulo.descripcion
    for repuesto in Repuesto.objects.select_related("articulo"):
        compatibles = list(repuesto.compatibilidades.select_related("modelo__marca"))
        assert len(compatibles) == 1
        modelo = compatibles[0].modelo
        nombre = (
            modelo.nombre
            if modelo.nombre.startswith(modelo.marca.nombre + " ")
            else f"{modelo.marca.nombre} {modelo.nombre}"
        )
        assert repuesto.articulo.titulo.endswith(nombre)
        assert compatibles[0].anio_desde >= semillas.ANIO_MINIMO.get(modelo.nombre, 2008)
    salida = StringIO()
    call_command("revisar_datos", stdout=salida)
    assert salida.getvalue() == "Inconsistencias: 0. Artículos revisados: 120.\n"


def test_migracion_transmision_conserva_id_y_referencias(db):
    from importlib import import_module

    from django.apps import apps

    from apps.catalogos.models import Transmision

    sembrar()
    transmision = Transmision.objects.get(nombre="Automática con modo manual")
    referencias = list(Auto.objects.filter(transmision=transmision).values_list("pk", flat=True))
    assert referencias
    transmision.nombre = "Automática/Dual"
    transmision.save(update_fields=["nombre"])
    identificador = transmision.pk
    migracion = import_module("apps.catalogos.migrations.0003_renombrar_transmision")
    migracion.renombrar(apps, None)
    transmision.refresh_from_db()
    assert transmision.pk == identificador
    assert transmision.nombre == "Automática con modo manual"
    assert (
        list(Auto.objects.filter(transmision=transmision).values_list("pk", flat=True))
        == referencias
    )
    migracion.deshacer(apps, None)
    transmision.refresh_from_db()
    assert transmision.nombre == "Automática/Dual"
