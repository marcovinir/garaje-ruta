from apps.comun.pruebas import cliente_de
from apps.cuentas.models import Usuario
from apps.negocio.models import ConfiguracionNegocio

URL = "/api/v1/panel/configuracion/"


def cliente(rol):
    return cliente_de(
        Usuario.objects.crear_usuario(
            f"{rol}@x.test", "U", "X", rol, password="Clave-Segura-2026", activo=True
        )
    )


def datos(**cambios):
    base = {
        "nombre": "Garaje Ruta",
        "logo_public_id": "",
        "whatsapp": "50688887777",
        "direccion": "Heredia centro",
        "mapa_url": "",
        "horarios": [{"dia_semana": 0, "apertura": "09:00", "cierre": "18:00"}],
    }
    return base | cambios


def test_put_reemplaza_horarios(db):
    r = cliente("admin").put(URL, datos(), format="json")
    assert r.status_code == 200, r.json()
    config = ConfiguracionNegocio.obtener()
    assert config.whatsapp == "50688887777"
    assert config.horarios.count() == 1
    assert r.json()["horarios"] == [{"dia_semana": 0, "apertura": "09:00", "cierre": "18:00"}]


def test_whatsapp_invalido(db):
    r = cliente("admin").put(URL, datos(whatsapp="8888-7777"), format="json")
    assert r.status_code == 400
    assert r.json()["campos"]["whatsapp"] == ["Escribí el número con código de país, solo dígitos."]


def test_horario_invalido(db):
    r = cliente("admin").put(
        URL,
        datos(horarios=[{"dia_semana": 0, "apertura": "18:00", "cierre": "09:00"}]),
        format="json",
    )
    assert r.status_code == 400


def test_colaborador_ve_pero_no_edita(db):
    c = cliente("colaborador")
    assert c.get(URL).status_code == 200
    assert c.put(URL, datos(), format="json").status_code == 403
