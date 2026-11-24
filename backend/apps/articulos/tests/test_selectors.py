from apps.articulos.models import Articulo, Compatibilidad, EstadoArticulo
from apps.articulos.selectors import descendientes, filtrar_catalogo, visibles_publico
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, modelo
from apps.catalogos.models import Carroceria, CategoriaPieza, Combustible, Equipamiento


def ids(qs) -> set[int]:
    return set(qs.values_list("id", flat=True))


def filtrar(**params) -> set[int]:
    return ids(filtrar_catalogo(visibles_publico(), {k: str(v) for k, v in params.items()}))


def test_visibles_publico(db):
    visible = crear_auto()
    crear_auto(estado=EstadoArticulo.VENDIDO)
    crear_auto(estado=EstadoArticulo.OCULTO)
    crear_auto(estado=EstadoArticulo.RESERVADO)
    rep = crear_repuesto(cantidad=2)
    crear_repuesto(cantidad=0)
    assert ids(visibles_publico()) == {visible.id, rep.id}


def test_filtro_tipo_marca_modelo(db):
    corolla = crear_auto(modelo=modelo("Toyota", "Corolla"))
    tucson = crear_auto(modelo=modelo("Hyundai", "Tucson"))
    rep = crear_repuesto()
    assert filtrar(tipo="auto") == {corolla.id, tucson.id}
    assert filtrar(tipo="repuesto") == {rep.id}
    assert filtrar(marca=corolla.auto.modelo.marca_id) == {corolla.id}
    assert filtrar(modelo=tucson.auto.modelo_id) == {tucson.id}


def test_filtros_de_rango(db):
    viejo = crear_auto(precio=4_000_000, anio=2010, kilometraje=200_000)
    nuevo = crear_auto(precio=9_000_000, anio=2020, kilometraje=40_000)
    assert filtrar(anio_min=2015) == {nuevo.id}
    assert filtrar(anio_max=2015) == {viejo.id}
    assert filtrar(precio_min=5_000_000) == {nuevo.id}
    assert filtrar(precio_max=5_000_000) == {viejo.id}
    assert filtrar(km_max=100_000) == {nuevo.id}


def test_filtros_de_catalogo(db):
    electrico = crear_auto(
        combustible=Combustible.objects.get(nombre="Eléctrico"),
        carroceria=Carroceria.objects.get(slug="suv"),
        cilindrada_cc=None,
    )
    gasolina = crear_auto()
    assert filtrar(combustible=electrico.auto.combustible_id) == {electrico.id}
    assert filtrar(carroceria="suv") == {electrico.id}
    assert filtrar(transmision=gasolina.auto.transmision_id) == {electrico.id, gasolina.id}
    assert filtrar(traccion=gasolina.auto.traccion_id) == {electrico.id, gasolina.id}


def test_filtro_condicion_y_ofertas(db):
    usado = crear_repuesto()
    oferta = crear_auto(precio_anterior_colones=7_000_000)
    crear_auto()
    assert filtrar(condicion="usado") == {usado.id}
    assert filtrar(ofertas=1) == {oferta.id}


def test_filtro_equipamiento_exige_todos(db):
    aire = Equipamiento.objects.get(nombre="Aire acondicionado")
    camara = Equipamiento.objects.get(nombre="Cámara de retroceso")
    completo = crear_auto()
    completo.auto.equipamiento.add(aire, camara)
    solo_aire = crear_auto()
    solo_aire.auto.equipamiento.add(aire)
    assert filtrar(equipamiento=f"{aire.id},{camara.id}") == {completo.id}
    assert filtrar(equipamiento=str(aire.id)) == {completo.id, solo_aire.id}


def test_categoria_incluye_descendientes(db):
    electrico = CategoriaPieza.objects.get(slug="sistema-electrico")
    alternador = CategoriaPieza.objects.create(
        nombre="Alternador", slug="alternador", padre=electrico
    )
    rep = crear_repuesto(categoria_pieza=alternador)
    assert set(descendientes(electrico)) == {electrico.id, alternador.id}
    assert filtrar(categoria="sistema-electrico") == {rep.id}
    assert filtrar(categoria="frenos") == set()


def test_compatible_con_vehiculo(db):
    corolla = modelo("Toyota", "Corolla")
    cubre = crear_repuesto()
    Compatibilidad.objects.create(
        repuesto=cubre.repuesto, modelo=corolla, anio_desde=2012, anio_hasta=2016
    )
    no_cubre = crear_repuesto()
    Compatibilidad.objects.create(
        repuesto=no_cubre.repuesto, modelo=corolla, anio_desde=2016, anio_hasta=2020
    )
    assert filtrar(compatible_modelo=corolla.id, compatible_anio=2015) == {cubre.id}
    assert filtrar(compatible_marca=corolla.marca_id) == {cubre.id, no_cubre.id}


def test_orden(db):
    barato = crear_auto(precio=3_000_000)
    caro = crear_auto(precio=9_000_000)
    qs = filtrar_catalogo(visibles_publico(), {"orden": "precio_asc"})
    assert list(qs.values_list("id", flat=True)) == [barato.id, caro.id]
    qs = filtrar_catalogo(visibles_publico(), {"orden": "precio_desc"})
    assert list(qs.values_list("id", flat=True)) == [caro.id, barato.id]
    qs = filtrar_catalogo(visibles_publico(), {})
    assert list(qs.values_list("id", flat=True)) == [caro.id, barato.id]  # recientes


def test_valores_invalidos_se_ignoran(db):
    a = crear_auto()
    assert filtrar(anio_min="abc", precio_max="", equipamiento="x,y", orden="raro") == {a.id}


def test_busqueda_sin_tildes_y_con_errores(db):
    corolla = crear_auto(titulo="Toyota Corolla 2015", modelo=modelo("Toyota", "Corolla"))
    con_camara = crear_auto(titulo="Hyundai Tucson 2019", modelo=modelo("Hyundai", "Tucson"))
    Articulo.objects.filter(pk=con_camara.pk).update(
        descripcion="Trae cámara de retroceso y sensores."
    )
    alternador = crear_repuesto(titulo="Alternador Hyundai Accent")
    assert corolla.id in filtrar(q="corola")
    assert filtrar(q="camara retroceso") == {con_camara.id}
    assert filtrar(q="alternador accent") == {alternador.id}
    assert filtrar(q="toyota") == {corolla.id}
