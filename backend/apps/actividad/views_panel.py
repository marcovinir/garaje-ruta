from rest_framework import serializers
from rest_framework.generics import ListAPIView

from apps.comun.permisos import tiene_permiso
from apps.cuentas.permisos import HISTORIAL_VER

from .models import AccionHistorial, HistorialCambio


class HistorialSerializer(serializers.ModelSerializer):
    accion_texto = serializers.CharField(source="get_accion_display")
    usuario = serializers.SerializerMethodField()
    articulo = serializers.SerializerMethodField()

    class Meta:
        model = HistorialCambio
        fields = ["id", "fecha", "accion", "accion_texto", "detalle", "usuario", "articulo"]

    def get_usuario(self, cambio) -> dict:
        return {"id": cambio.usuario_id, "nombre": str(cambio.usuario)}

    def get_articulo(self, cambio) -> dict:
        return {"id": cambio.articulo_id, "titulo": cambio.articulo.titulo}


class HistorialPanelView(ListAPIView):
    permission_classes = [tiene_permiso(HISTORIAL_VER)]
    serializer_class = HistorialSerializer

    def get_queryset(self):
        qs = HistorialCambio.objects.select_related("usuario", "articulo")
        params = self.request.query_params
        for parametro in ("articulo", "usuario"):
            valor = params.get(parametro)
            if valor and valor.isdigit():
                qs = qs.filter(**{f"{parametro}_id": int(valor)})
        if (accion := params.get("accion")) in AccionHistorial.values:
            qs = qs.filter(accion=accion)
        return qs
