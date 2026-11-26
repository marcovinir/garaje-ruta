from datetime import date
from decimal import Decimal

from django.test import override_settings

from apps.actividad.models import TipoCambio
from apps.articulos.marketplace import telefono_local
from apps.articulos.models import Compatibilidad, Foto
from apps.articulos.tests.fabricas import crear_auto, crear_repuesto, modelo
from apps.catalogos.models import Equipamiento
from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario
from apps.negocio.models import ConfiguracionNegocio


def cliente(rol: str = "admin"):
    usuario = Usuario.objects.crear_usuario(f"{rol}@x.test", rol.title(), "X", rol, activo=True)
    return cliente_de(usuario)


def negocio():
    config = ConfiguracionNegocio.obtener()
    config.nombre, config.direccion, config.whatsapp = "Garaje Ruta", "Heredia", "50686877280"
    config.save()


def campos(datos):
    return {c["etiqueta"]: c["valor"] for c in datos["campos"]}


def test_telefono_local():
    assert telefono_local("50686877280") == "8687-7280"
    assert telefono_local("86877280") == "8687-7280"
    assert telefono_local("15551234567") == "15551234567"


@override_settings(FRONTEND_URL="https://garajeruta.test")
def test_auto_arma_casillas_y_descripcion(db):
    negocio()
    TipoCambio.objects.create(
        fecha=date(2026, 11, 26), compra=Decimal("500"), venta=Decimal("510"), fuente="x"
    )
    a = crear_auto(precio=8_500_000, titulo="Toyota Corolla 2015", unico_dueno=True)
    a.descripcion = "Llantas nuevas."
    a.save()
    a.auto.equipamiento.add(Equipamiento.objects.get(nombre="Bluetooth"))
    Foto.objects.create(articulo=a, public_id="garaje-ruta/b", ancho=1, alto=1, orden=2)
    Foto.objects.create(articulo=a, public_id="garaje-ruta/a", ancho=1, alto=1, orden=1)

    r = cliente().get(f"/api/v1/panel/articulos/{a.id}/marketplace/")
    assert r.status_code == 200
    datos = r.json()
    c = campos(datos)
    assert c["Precio"] == "8500000"
    assert c["Año"] == "2015"
    assert c["Marca"] == "Toyota"
    assert c["Kilometraje"] == "120 000 km"
    assert c["Transmisión"] == "Automática"
    assert "Color interior" not in c  # vacío: no se muestra
    texto = datos["descripcion"]
    assert texto.startswith("Toyota Corolla 2015 · ₡8 500 000 (≈ $16 670)")
    assert "✔ 120 000 km · Automática · Gasolina · 1 800 cc · 4x2" in texto
    assert "Único dueño · De agencia · Marchamo al día" in texto
    assert "Equipamiento: Bluetooth" in texto
    assert "Precio negociable" in texto
    assert "Llantas nuevas." in texto
    assert "📍 Garaje Ruta, Heredia" in texto
    assert f"https://garajeruta.test/autos/toyota-corolla-2015-{a.id}" in texto
    assert texto.endswith("WhatsApp: 8687-7280")
    assert datos["fotos"] == ["garaje-ruta/a", "garaje-ruta/b"]


def test_sin_tipo_de_cambio_no_muestra_dolares(db):
    a = crear_auto()
    texto = cliente().get(f"/api/v1/panel/articulos/{a.id}/marketplace/").json()["descripcion"]
    assert "≈" not in texto.splitlines()[0]


def test_repuesto_con_compatibilidades(db):
    r = crear_repuesto(titulo="Alternador Hyundai Accent", numero_parte="37300-22650")
    for anio in (2010, 2012, 2014, 2016, 2018):
        Compatibilidad.objects.create(
            repuesto=r.repuesto,
            modelo=modelo("Hyundai", f"Accent {anio}"),
            anio_desde=anio,
            anio_hasta=anio + 1,
        )
    datos = cliente().get(f"/api/v1/panel/articulos/{r.id}/marketplace/").json()
    assert campos(datos)["Estado"] == "Usado"
    texto = datos["descripcion"]
    assert "Número de parte: 37300-22650" in texto
    assert "Compatible con Hyundai Accent 2010 2010–2011" in texto
    assert texto.count("–") == 4 and "y 1 más" in texto
    assert f"/repuestos/alternador-hyundai-accent-{r.id}" in texto


def test_el_demo_puede_verlo_y_sin_sesion_no(db):
    a = crear_auto()
    assert cliente("demo").get(f"/api/v1/panel/articulos/{a.id}/marketplace/").status_code == 200
    assert cliente_de().get(f"/api/v1/panel/articulos/{a.id}/marketplace/").status_code == 403
