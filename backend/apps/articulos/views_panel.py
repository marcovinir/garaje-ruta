from django.db.models import Max, Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.actividad.models import TipoCambio
from apps.comun.permisos import tiene_permiso
from apps.cuentas.permisos import (
    ARTICULOS_CREAR,
    ARTICULOS_EDITAR,
    ARTICULOS_ELIMINAR,
    ARTICULOS_VER,
)

from . import services
from .models import Articulo, EstadoArticulo, TipoArticulo
from .selectors import articulo_con_relaciones
from .serializers_panel import (
    ArticuloEscrituraSerializer,
    DetallePanelSerializer,
    FilaPanelSerializer,
)

PERMISO_POR_ACCION = {
    "create": ARTICULOS_CREAR,
    "duplicar": ARTICULOS_CREAR,
    "partial_update": ARTICULOS_EDITAR,
    "destroy": ARTICULOS_ELIMINAR,
}


def filtrar_panel(qs, params):
    if q := (params.get("q") or "").strip():
        qs = qs.filter(
            Q(titulo__icontains=q)
            | Q(repuesto__codigo_interno__icontains=q)
            | Q(repuesto__numero_parte__icontains=q)
        )
    if (tipo := params.get("tipo")) in TipoArticulo.values:
        qs = qs.filter(tipo=tipo)
    if (estado := params.get("estado")) in EstadoArticulo.values:
        qs = qs.filter(estado=estado)
    if params.get("agotado") == "1":
        qs = qs.filter(tipo=TipoArticulo.REPUESTO, repuesto__cantidad=0)
    if desde := params.get("desde"):
        qs = qs.filter(publicado_en__date__gte=desde)
    if hasta := params.get("hasta"):
        qs = qs.filter(publicado_en__date__lte=hasta)
    if params.get("orden") == "actualizados":
        return qs.order_by("-actualizado_en", "-id")
    return qs.order_by("-publicado_en", "-id")


class ArticuloPanelViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [tiene_permiso(ARTICULOS_VER)]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        codigo = PERMISO_POR_ACCION.get(self.action)
        clases = [*self.permission_classes, *([tiene_permiso(codigo)] if codigo else [])]
        return [clase() for clase in clases]

    def get_queryset(self):
        qs = articulo_con_relaciones().annotate(fecha_venta=Max("ventas__fecha"))
        if self.action == "list":
            return filtrar_panel(qs, self.request.query_params)
        return qs

    def get_serializer_class(self):
        return FilaPanelSerializer if self.action == "list" else DetallePanelSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "tipo_cambio": TipoCambio.vigente()}

    def _detalle(self, articulo: Articulo, codigo=status.HTTP_200_OK) -> Response:
        articulo = self.get_queryset().get(pk=articulo.pk)
        return Response(DetallePanelSerializer(articulo).data, status=codigo)

    def create(self, request):
        entrada = ArticuloEscrituraSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        articulo = services.crear_articulo(entrada.validated_data, request.user)
        return self._detalle(articulo, status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        articulo = self.get_object()
        entrada = ArticuloEscrituraSerializer(articulo, data=request.data, partial=True)
        entrada.is_valid(raise_exception=True)
        articulo = services.editar_articulo(articulo, entrada.validated_data, request.user)
        return self._detalle(articulo)

    def destroy(self, request, pk=None):
        services.eliminar_articulo(self.get_object(), request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def duplicar(self, request, pk=None):
        copia = services.duplicar_articulo(self.get_object(), request.user)
        return self._detalle(copia, status.HTTP_201_CREATED)
