import pytest
from django.db import IntegrityError

from apps.catalogos.models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    Equipamiento,
    GrupoEquipamiento,
    Marca,
    Modelo,
    Traccion,
    Transmision,
)


def test_catalogos_iniciales(db):
    assert Transmision.objects.count() == 4
    assert Combustible.objects.count() == 6
    assert Traccion.objects.count() == 3
    assert list(Carroceria.objects.order_by("orden").values_list("nombre", flat=True)) == [
        "Sedán",
        "Hatchback",
        "SUV",
        "Crossover",
        "Pickup",
        "Microbús",
        "Comercial",
        "Coupé",
    ]
    assert list(GrupoEquipamiento.objects.order_by("orden").values_list("nombre", flat=True)) == [
        "Confort",
        "Seguridad",
        "Tecnología",
        "Motor y manejo",
        "Exterior",
    ]


def test_equipamiento_inicial(db):
    aire = Equipamiento.objects.get(nombre="Aire acondicionado")
    assert aire.filtrable is True
    assert aire.grupo.nombre == "Confort"
    assert Equipamiento.objects.count() == 50
    assert set(Equipamiento.objects.filter(filtrable=True).values_list("nombre", flat=True)) == {
        "Aire acondicionado",
        "Vidrios eléctricos",
        "Tapicería de cuero",
        "Techo solar o panorámico",
        "Control crucero",
        "Cámara de retroceso",
        "Sensores de retroceso",
        "Apple CarPlay",
        "Android Auto",
    }


def test_categorias_de_pieza_raiz(db):
    raices = CategoriaPieza.objects.filter(padre__isnull=True)
    assert raices.count() == 10
    assert raices.filter(nombre="Sistema eléctrico", slug="sistema-electrico").exists()


def test_modelo_unico_por_marca(db):
    toyota = Marca.objects.create(nombre="Toyota", slug="toyota")
    hyundai = Marca.objects.create(nombre="Hyundai", slug="hyundai")
    corolla = Modelo.objects.create(marca=toyota, nombre="Corolla", slug="corolla")
    assert str(corolla) == "Toyota Corolla"
    Modelo.objects.create(marca=hyundai, nombre="Corolla", slug="corolla")
    with pytest.raises(IntegrityError):
        Modelo.objects.create(marca=toyota, nombre="Corolla", slug="corolla-2")


def test_categoria_hija(db):
    electrico = CategoriaPieza.objects.get(slug="sistema-electrico")
    alternador = CategoriaPieza.objects.create(
        nombre="Alternador", slug="alternador", padre=electrico
    )
    assert alternador in electrico.hijas.all()
    assert str(alternador) == "Alternador"
