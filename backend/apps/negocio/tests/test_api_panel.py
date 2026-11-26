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


def test_condiciones_comerciales_del_negocio(db):
    from rest_framework.test import APIClient

    campos = {
        "garantia_repuestos": "Según la pieza",
        "condiciones_devolucion": None,
        "metodos_entrega": "Retiro en el local",
        "metodos_pago": "Transferencia",
        "condiciones_compra": "   ",
    }
    publicos = APIClient().get("/api/v1/configuracion/").json()
    assert all(publicos[campo] is None for campo in campos)
    c = cliente("admin")
    res = c.put(URL, datos(**campos), format="json")
    assert res.status_code == 200
    campos["condiciones_compra"] = None
    publicos = APIClient().get("/api/v1/configuracion/").json()
    for campo, valor in campos.items():
        assert res.json()[campo] == publicos[campo] == valor
    assert c.put(URL, datos(), format="json").json()["metodos_pago"] == "Transferencia"


def test_edita_preguntas_y_redes_y_las_expone_en_orden(db):
    from rest_framework.test import APIClient

    publico = APIClient()
    ruta = "/api/v1/configuracion/"
    assert publico.get(ruta).json()["preguntas_frecuentes"] == []
    assert publico.get(ruta).json()["redes_sociales"] == []
    admin = cliente("admin")
    nuevos = {
        "preguntas_frecuentes": [
            {"pregunta": " ¿Cómo consulto? ", "respuesta": " Escribinos. "},
            {"pregunta": "¿Cómo llego?", "respuesta": "Consultá el mapa."},
        ],
        "redes_sociales": [{"red": " Red de prueba ", "url": "https://social.example/perfil"}],
    }
    respuesta = admin.put(URL, datos(**nuevos), format="json")
    assert respuesta.status_code == 200
    nuevos["preguntas_frecuentes"][0] = {"pregunta": "¿Cómo consulto?", "respuesta": "Escribinos."}
    nuevos["redes_sociales"][0]["red"] = "Red de prueba"
    for campo, valor in nuevos.items():
        assert respuesta.json()[campo] == publico.get(ruta).json()[campo] == valor
    assert (
        admin.put(URL, datos(), format="json").json()["redes_sociales"] == nuevos["redes_sociales"]
    )
    res = admin.put(URL, datos(preguntas_frecuentes=[], redes_sociales=[]), format="json")
    assert res.status_code == 200
    assert publico.get(ruta).json()["preguntas_frecuentes"] == []
    assert publico.get(ruta).json()["redes_sociales"] == []


def test_rechaza_pregunta_incompleta_y_url_sin_http(db):
    res = cliente("admin").put(
        URL,
        datos(
            preguntas_frecuentes=[{"pregunta": " ", "respuesta": "Escribinos."}],
            redes_sociales=[{"red": "Prueba", "url": "ftp://social.example/perfil"}],
        ),
        format="json",
    )
    assert res.status_code == 400
    assert "preguntas_frecuentes.0.pregunta" in res.json()["campos"]
    assert "redes_sociales.0.url" in res.json()["campos"]
