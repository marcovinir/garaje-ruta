from rest_framework.test import APIClient

from apps.articulos.tests.fabricas import modelo
from apps.catalogos.models import Marca


def test_catalogos_publicos(db):
    modelo("Toyota", "Corolla")
    Marca.objects.create(nombre="Sin modelos", slug="sin-modelos")
    datos = APIClient().get("/api/v1/catalogos/").json()
    assert [m["nombre"] for m in datos["marcas"]] == ["Toyota"]
    assert datos["marcas"][0]["modelos"][0]["nombre"] == "Corolla"
    assert [g["grupo"] for g in datos["equipamiento"]] == [
        "Confort",
        "Seguridad",
        "Tecnología",
        "Motor y manejo",
        "Exterior",
    ]
    aire = datos["equipamiento"][0]["items"][0]
    assert aire["nombre"] == "Aire acondicionado" and aire["filtrable"] is True
    assert len(datos["categorias"]) == 10
    assert {"id", "nombre", "slug", "hijas"} <= set(datos["categorias"][0])
    assert datos["carrocerias"][0] == {
        "id": datos["carrocerias"][0]["id"],
        "nombre": "Sedán",
        "slug": "sedan",
    }
    assert len(datos["transmisiones"]) == 4
    assert len(datos["combustibles"]) == 6
    assert len(datos["tracciones"]) == 3
