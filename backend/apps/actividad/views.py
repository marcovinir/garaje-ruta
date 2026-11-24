from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TipoCambio
from .services import registrar_vista

DIAS_PARA_DESACTUALIZADO = 3


class TipoCambioView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "publico"

    def get(self, request):
        tipo = TipoCambio.vigente()
        if tipo is None:
            raise NotFound("Aún no hay tipo de cambio.")
        limite = timezone.localdate() - timedelta(days=DIAS_PARA_DESACTUALIZADO)
        return Response(
            {
                "fecha": str(tipo.fecha),
                "compra": str(tipo.compra),
                "venta": str(tipo.venta),
                "fuente": tipo.fuente,
                "desactualizado": tipo.fecha < limite,
            }
        )


class VistasView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "vistas"

    def post(self, request, pk: int):
        registrar_vista(pk)
        return Response(status=204)
