"""Fábricas de datos para las pruebas (también las usan las pruebas de otras apps)."""

from apps.articulos.models import (
    Articulo,
    Auto,
    CondicionRepuesto,
    EstadoGeneral,
    Procedencia,
    Repuesto,
    TipoArticulo,
)
from apps.catalogos.models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    Marca,
    Modelo,
    Traccion,
    Transmision,
)
from apps.cuentas.models import Usuario


def usuario_admin() -> Usuario:
    usuario = Usuario.objects.filter(email="fabrica@x.test").first()
    return usuario or Usuario.objects.crear_usuario(
        "fabrica@x.test", "Fábrica", "Pruebas", "admin", activo=True
    )


def modelo(marca: str = "Toyota", nombre: str = "Corolla") -> Modelo:
    m, _ = Marca.objects.get_or_create(nombre=marca, defaults={"slug": marca.lower()})
    mod, _ = Modelo.objects.get_or_create(
        marca=m, nombre=nombre, defaults={"slug": nombre.lower().replace(" ", "-")}
    )
    return mod


def crear_auto(precio: int = 6_500_000, **campos) -> Articulo:
    datos_articulo = {
        "tipo": TipoArticulo.AUTO,
        "titulo": "Toyota Corolla 2015",
        "precio_colones": precio,
        "creado_por": usuario_admin(),
    }
    for clave in ("titulo", "estado", "destacado", "precio_anterior_colones"):
        if clave in campos:
            datos_articulo[clave] = campos.pop(clave)
    articulo = Articulo.objects.create(**datos_articulo)
    datos_auto = {
        "modelo": campos.pop("modelo", None) or modelo(),
        "anio": 2015,
        "kilometraje": 120_000,
        "transmision": Transmision.objects.get(nombre="Automática"),
        "combustible": Combustible.objects.get(nombre="Gasolina"),
        "traccion": Traccion.objects.get(nombre="4x2"),
        "carroceria": Carroceria.objects.get(slug="sedan"),
        "color_exterior": "Blanco",
        "cilindrada_cc": 1800,
        "puertas": 4,
        "pasajeros": 5,
        "unico_dueno": False,
        "procedencia": Procedencia.AGENCIA,
        "marchamo_al_dia": True,
        "acepta_vehiculo": False,
        "precio_negociable": True,
        "estado_general": EstadoGeneral.MUY_BUENO,
    }
    Auto.objects.create(articulo=articulo, **{**datos_auto, **campos})
    return articulo


def crear_repuesto(cantidad: int = 1, precio: int = 45_000, **campos) -> Articulo:
    articulo = Articulo.objects.create(
        tipo=TipoArticulo.REPUESTO,
        titulo=campos.pop("titulo", "Alternador Hyundai Accent"),
        precio_colones=precio,
        creado_por=usuario_admin(),
    )
    Repuesto.objects.create(
        articulo=articulo,
        categoria_pieza=CategoriaPieza.objects.get(slug="sistema-electrico"),
        condicion=CondicionRepuesto.USADO,
        cantidad=cantidad,
        **campos,
    )
    return articulo
