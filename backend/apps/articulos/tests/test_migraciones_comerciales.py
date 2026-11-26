import pytest
from django.core.management import call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from apps.articulos.models import Compatibilidad
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, modelo


@pytest.mark.django_db(transaction=True, serialized_rollback=True)
def test_migraciones_comerciales_preservan_registros():
    anteriores = [("articulos", "0004_busqueda"), ("negocio", "0002_configuracion_inicial")]
    nuevas = [("articulos", "0005_campos_comerciales"), ("negocio", "0003_campos_comerciales")]
    auto = crear_auto()
    repuesto = crear_repuesto(numero_parte="123")
    compatibilidad = Compatibilidad.objects.create(
        repuesto=repuesto.repuesto, modelo=modelo(), anio_desde=2012, anio_hasta=2016
    )
    filas = [
        ("articulos", "Auto", auto.pk, {"anio": 2015, "kilometraje": 120_000}),
        ("articulos", "Repuesto", repuesto.pk, {"numero_parte": "123", "cantidad": 1}),
        (
            "articulos",
            "Compatibilidad",
            compatibilidad.pk,
            {"anio_desde": 2012, "anio_hasta": 2016},
        ),
        ("negocio", "ConfiguracionNegocio", 1, {"nombre": "Garaje Ruta"}),
    ]

    def migrar(destinos):
        for app, migracion in destinos:
            call_command("migrate", app, migracion, verbosity=0)

    try:
        migrar(anteriores)
        estado_anterior = MigrationExecutor(connection).loader.project_state(anteriores)
        migrar(nuevas)
        estado_nuevo = MigrationExecutor(connection).loader.project_state(nuevas)
        columnas_nuevas = {}
        for app, nombre, pk, valores in filas:
            modelo_anterior = estado_anterior.apps.get_model(app, nombre)
            modelo_nuevo = estado_nuevo.apps.get_model(app, nombre)
            registro = modelo_nuevo.objects.get(pk=pk)
            assert {campo: getattr(registro, campo) for campo in valores} == valores
            campos_anteriores = {campo.name for campo in modelo_anterior._meta.fields}
            campos_nuevos = [
                campo for campo in modelo_nuevo._meta.fields if campo.name not in campos_anteriores
            ]
            assert campos_nuevos
            assert all(
                campo.null and campo.blank and getattr(registro, campo.name) is None
                for campo in campos_nuevos
            )
            columnas_nuevas[modelo_nuevo._meta.db_table] = {campo.column for campo in campos_nuevos}

        migrar(anteriores)
        with connection.cursor() as cursor:
            for tabla, nuevas_en_tabla in columnas_nuevas.items():
                columnas = {
                    c.name for c in connection.introspection.get_table_description(cursor, tabla)
                }
                assert columnas.isdisjoint(nuevas_en_tabla)
        for app, nombre, pk, valores in filas:
            registro = estado_anterior.apps.get_model(app, nombre).objects.get(pk=pk)
            assert {campo: getattr(registro, campo) for campo in valores} == valores
    finally:
        # Las pruebas siguientes usan el esquema completo, incluidas migraciones posteriores.
        call_command("migrate", verbosity=0)
