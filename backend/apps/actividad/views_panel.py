from django.db.models import Exists, OuterRef
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.comun.permisos import tiene_permiso
from apps.comun.serializers import fecha_opcional
from apps.cuentas.models import Usuario
from apps.cuentas.permisos import HISTORIAL_VER

from .models import AccionHistorial, HistorialCambio


def autor(usuario):
    return {"id": usuario.pk, "nombre": str(usuario)}


class HistorialSerializer(serializers.ModelSerializer):
    accion_texto = serializers.CharField(source="get_accion_display")
    usuario = serializers.SerializerMethodField()
    articulo = serializers.SerializerMethodField()

    class Meta:
        model = HistorialCambio
        fields = ["id", "fecha", "accion", "accion_texto", "detalle", "usuario", "articulo"]

    def get_usuario(self, cambio) -> dict:
        return autor(cambio.usuario)

    def get_articulo(self, cambio) -> dict:
        titulo = cambio.titulo_articulo
        if not titulo and cambio.articulo_id is not None:
            titulo = cambio.articulo.titulo
        return {"id": cambio.articulo_id, "titulo": titulo or "Artículo eliminado"}


class HistorialPanelView(ListAPIView):
    permission_classes = [tiene_permiso(HISTORIAL_VER)]
    serializer_class = HistorialSerializer

    def get_queryset(self):
        qs = HistorialCambio.objects.select_related("usuario", "articulo")
        params = self.request.query_params
        for parametro in ("articulo", "usuario"):
            valor = params.get(parametro, "")
            if valor.isascii() and valor.isdigit() and len(valor) <= 19:
                numero = int(valor)
                if 0 < numero < 2**63:
                    qs = qs.filter(**{f"{parametro}_id": numero})
        if (accion := params.get("accion")) in AccionHistorial.values:
            qs = qs.filter(accion=accion)
        if desde := fecha_opcional(params.get("desde")):
            qs = qs.filter(fecha__date__gte=desde)
        if hasta := fecha_opcional(params.get("hasta")):
            qs = qs.filter(fecha__date__lte=hasta)
        return qs.order_by("-fecha", "-id")


class AutoresHistorialView(APIView):
    permission_classes = [tiene_permiso(HISTORIAL_VER)]

    def get(self, request):
        autores = Usuario.objects.filter(
            Exists(HistorialCambio.objects.filter(usuario_id=OuterRef("pk")))
        ).order_by("nombre", "apellidos", "id")
        return Response([autor(usuario) for usuario in autores])
