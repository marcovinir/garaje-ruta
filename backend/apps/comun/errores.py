import logging

from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler

MENSAJE_VALIDACION = "Revisá los datos marcados."


logger = logging.getLogger(__name__)


def _a_texto(valor) -> str:
    if isinstance(valor, list):
        return " ".join(_a_texto(v) for v in valor)
    if isinstance(valor, dict):
        return " ".join(_a_texto(v) for v in valor.values())
    return str(valor)


def _aplanar(errores: dict, prefijo: str = "") -> dict[str, list[str]]:
    """{"repuesto": {"cantidad": [...]}} → {"repuesto.cantidad": [...]}: un error por campo."""
    campos: dict[str, list[str]] = {}
    for clave, valor in errores.items():
        # El error general de un objeto anidado (p. ej. una lista vacía) va a ese objeto.
        ruta = (
            prefijo.rstrip(".") if clave == "non_field_errors" and prefijo else f"{prefijo}{clave}"
        )
        if isinstance(valor, dict):
            campos.update(_aplanar(valor, f"{ruta}."))
        else:
            campos[ruta] = [str(e) for e in (valor if isinstance(valor, list) else [valor])]
    return campos


def manejador_excepciones(exc, context):
    """Da a todos los errores de la API la forma {"detalle": str, "campos": {...}}."""
    if isinstance(exc, CorreoNoEnviado):
        logger.warning("Fallo del servidor de correo (%s)", type(exc.__cause__).__name__)
    respuesta = exception_handler(exc, context)
    if respuesta is None:
        return None

    datos = respuesta.data
    if isinstance(exc, ValidationError):
        if isinstance(datos, dict):
            no_campo = datos.pop("non_field_errors", None)
            campos = _aplanar(datos)
            detalle = _a_texto(no_campo) if no_campo else MENSAJE_VALIDACION
        else:
            campos, detalle = {}, _a_texto(datos)
    else:
        detalle = datos.get("detail", datos) if isinstance(datos, dict) else datos
        campos, detalle = {}, _a_texto(detalle)

    respuesta.data = {"detalle": detalle, "campos": campos}
    return respuesta


class CorreoNoEnviado(APIException):
    """El backend de correo no pudo enviar el mensaje."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "No pudimos enviar el correo. Probá de nuevo en unos minutos."
    default_code = "correo_no_enviado"


class Conflicto(APIException):
    """El pedido choca con el estado actual de los datos (HTTP 409)."""

    status_code = 409
    default_detail = "El pedido choca con el estado actual de los datos."
    default_code = "conflicto"
