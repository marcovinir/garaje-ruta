"""Límite de peticiones por alcance, con una excepción para el servidor de Next.

La web pública se renderiza en el servidor: Next le pide los datos a Django desde una sola IP.
Sin esta excepción, todas las visitas compartirían el límite de esa IP y la web vería 429.
Next se identifica con el encabezado `X-Servidor-Next: {SERVIDOR_NEXT_SECRETO}`.
"""

import hmac

from django.conf import settings
from rest_framework.settings import api_settings
from rest_framework.throttling import ScopedRateThrottle


def es_servidor_next(request) -> bool:
    secreto = getattr(settings, "SERVIDOR_NEXT_SECRETO", "")
    enviado = request.META.get("HTTP_X_SERVIDOR_NEXT", "")
    return bool(secreto) and hmac.compare_digest(secreto, enviado)


class LimitePorAlcance(ScopedRateThrottle):
    def get_rate(self):
        # Lee las tasas en cada petición (DRF las fija al importar la clase).
        return api_settings.DEFAULT_THROTTLE_RATES.get(self.scope)

    def allow_request(self, request, view):
        if es_servidor_next(request):
            return True
        return super().allow_request(request, view)
