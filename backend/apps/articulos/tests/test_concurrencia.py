"""Dos «Vendí 1» al mismo tiempo sobre la última unidad: uno vende, el otro recibe 409."""

import threading

import pytest
from django.db import connection

from apps.actividad.models import Venta
from apps.articulos.models import Articulo
from apps.articulos.services import vender
from apps.articulos.tests.fabricas import crear_repuesto, usuario_admin
from apps.comun.errores import Conflicto


@pytest.mark.django_db(transaction=True, serialized_rollback=True)
def test_dos_ventas_simultaneas_de_la_ultima_unidad():
    articulo_id = crear_repuesto(cantidad=1).id
    usuario = usuario_admin()
    barrera = threading.Barrier(2)
    resultados: list[str] = []

    def vender_uno():
        try:
            barrera.wait()
            vender(Articulo.objects.get(id=articulo_id), usuario, 1)
            resultados.append("vendió")
        except Conflicto as error:
            resultados.append(str(error.detail))
        finally:
            connection.close()

    hilos = [threading.Thread(target=vender_uno) for _ in range(2)]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()

    assert sorted(resultados) == ["Solo quedan 0.", "vendió"]
    assert Venta.objects.filter(articulo_id=articulo_id).count() == 1
    assert Articulo.objects.get(id=articulo_id).repuesto.cantidad == 0


@pytest.mark.django_db(transaction=True, serialized_rollback=True)
def test_editar_mientras_se_vende_no_pisa_la_venta():
    """Editar con una copia vieja no debe devolver el auto a «disponible» ni subir el stock."""
    from apps.articulos.services import editar_articulo
    from apps.articulos.tests.fabricas import crear_auto

    auto_id = crear_auto().id
    rep_id = crear_repuesto(cantidad=3).id
    usuario = usuario_admin()
    viejo_auto = Articulo.objects.get(id=auto_id)
    viejo_rep = Articulo.objects.get(id=rep_id)
    vender(Articulo.objects.get(id=auto_id), usuario, 1)
    vender(Articulo.objects.get(id=rep_id), usuario, 2)
    editar_articulo(viejo_auto, {"precio_colones": 6_000_000}, usuario)
    editar_articulo(viejo_rep, {"titulo": "Alternador revisado"}, usuario)
    assert Articulo.objects.get(id=auto_id).estado == "vendido"
    assert Articulo.objects.get(id=rep_id).repuesto.cantidad == 1
