from io import BytesIO

from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .serializers_eventos import EventoComercialSerializer

MAX_CUERPO_EVENTO = 1024


class JSONEvento(JSONParser):
    def parse(self, stream, media_type=None, parser_context=None):
        cuerpo = stream.read(MAX_CUERPO_EVENTO + 1)
        if len(cuerpo) > MAX_CUERPO_EVENTO:
            raise ParseError("El evento es demasiado grande.")
        try:
            return super().parse(BytesIO(cuerpo), media_type, parser_context)
        except RecursionError:
            raise ParseError("El evento no tiene un formato válido.") from None


class LimiteEventos(ScopedRateThrottle):
    def get_rate(self):
        return api_settings.DEFAULT_THROTTLE_RATES.get(self.scope)

    def get_cache_key(self, request, view):
        # Una cuota global evita persistir IP o identificadores incluso en la caché.
        return self.cache_format % {"scope": self.scope, "ident": "global"}


class EventosView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONEvento]
    throttle_classes = [LimiteEventos]
    throttle_scope = "eventos"

    def post(self, request):
        evento = EventoComercialSerializer(data=request.data)
        evento.is_valid(raise_exception=True)
        evento.save()
        return Response(status=204)
