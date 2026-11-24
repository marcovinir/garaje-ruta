from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.actividad.models import TipoCambio

from .selectors import filtrar_catalogo, visibles_publico
from .serializers_publicos import TarjetaSerializer

MAX_DESTACADOS = 8


class VistaPublica(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "publico"

    def get_serializer_context(self) -> dict:
        return {"request": self.request, "tipo_cambio": TipoCambio.vigente()}


class ArticulosPublicosView(VistaPublica, ListAPIView):
    serializer_class = TarjetaSerializer

    def get_queryset(self):
        return filtrar_catalogo(visibles_publico(), self.request.query_params)


class DestacadosView(VistaPublica):
    def get(self, request):
        destacados = list(visibles_publico().filter(destacado=True)[:MAX_DESTACADOS])
        faltan = MAX_DESTACADOS - len(destacados)
        if faltan > 0:
            destacados += list(
                visibles_publico().exclude(id__in=[a.id for a in destacados])[:faltan]
            )
        datos = TarjetaSerializer(destacados, many=True, context=self.get_serializer_context())
        return Response(datos.data)
