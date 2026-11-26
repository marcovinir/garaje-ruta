from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.actividad.models import TipoCambio

from .models import Articulo
from .presentacion import ruta_publica
from .selectors import (
    articulo_con_relaciones,
    compatibilidades_con_modelo,
    estado_publico,
    filtrar_catalogo,
    similares,
    visibles_publico,
)
from .serializers_publicos import FichaSerializer, TarjetaSerializer

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


class FichaView(VistaPublica):
    def get(self, request, pk: int):
        articulo = get_object_or_404(articulo_con_relaciones(), pk=pk)
        estado = estado_publico(articulo)
        if estado in ("disponible", "reservado"):
            return Response(FichaSerializer(articulo, context=self.get_serializer_context()).data)
        datos = {"id": articulo.id, "tipo": articulo.tipo, "estado_publico": estado}
        if estado != "no_disponible":
            datos.update(titulo=articulo.titulo, ruta=ruta_publica(articulo))
        return Response(datos)


class SimilaresView(VistaPublica):
    def get(self, request, pk: int):
        referentes = Articulo.objects.select_related("auto__modelo", "repuesto").prefetch_related(
            compatibilidades_con_modelo()
        )
        articulo = get_object_or_404(referentes, pk=pk)
        datos = TarjetaSerializer(
            similares(articulo), many=True, context=self.get_serializer_context()
        )
        return Response(datos.data)


class SitemapView(VistaPublica):
    def get(self, request):
        return Response(
            [
                {"ruta": ruta_publica(a), "actualizado_en": a.actualizado_en}
                for a in visibles_publico().order_by("-publicado_en")
            ]
        )
