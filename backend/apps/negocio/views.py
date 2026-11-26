from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ConfiguracionNegocio


def configuracion_json(config: ConfiguracionNegocio) -> dict:
    return {
        "nombre": config.nombre,
        "logo_public_id": config.logo_public_id,
        "whatsapp": config.whatsapp,
        "direccion": config.direccion,
        "mapa_url": config.mapa_url,
        "garantia_repuestos": config.garantia_repuestos,
        "condiciones_devolucion": config.condiciones_devolucion,
        "metodos_entrega": config.metodos_entrega,
        "metodos_pago": config.metodos_pago,
        "condiciones_compra": config.condiciones_compra,
        "preguntas_frecuentes": config.preguntas_frecuentes,
        "redes_sociales": config.redes_sociales,
        "horarios": [
            {
                "dia_semana": h.dia_semana,
                "apertura": h.apertura.strftime("%H:%M"),
                "cierre": h.cierre.strftime("%H:%M"),
            }
            for h in config.horarios.all()
        ],
    }


class ConfiguracionPublicaView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "publico"

    def get(self, request):
        return Response(configuracion_json(ConfiguracionNegocio.obtener()))
