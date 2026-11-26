from django.db.models import Max, Q
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.actividad.models import TipoCambio
from apps.comun.permisos import tiene_alguno, tiene_permiso
from apps.comun.serializers import fecha_opcional
from apps.cuentas.permisos import (
    ARTICULOS_CAMBIAR_ESTADO,
    ARTICULOS_CREAR,
    ARTICULOS_EDITAR,
    ARTICULOS_ELIMINAR,
    ARTICULOS_VER,
    VENTAS_REGISTRAR,
)

from . import services
from .fotos import obtener_almacen
from .marketplace import texto_marketplace
from .models import Articulo, EstadoArticulo, TipoArticulo
from .selectors import articulo_con_relaciones
from .serializers_panel import (
    ArticuloEscrituraSerializer,
    DetallePanelSerializer,
    FilaPanelSerializer,
    FotoEntradaSerializer,
)
from .serializers_publicos import foto_json

PERMISO_POR_ACCION = {
    "create": ARTICULOS_CREAR,
    "duplicar": ARTICULOS_CREAR,
    "partial_update": ARTICULOS_EDITAR,
    "destroy": ARTICULOS_ELIMINAR,
    "estado": ARTICULOS_CAMBIAR_ESTADO,
    "vender": VENTAS_REGISTRAR,
    "deshacer_venta": VENTAS_REGISTRAR,
    "fotos": ARTICULOS_EDITAR,
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
    # Una fecha que no es AAAA-MM-DD válida se ignora (como en filtrar_catalogo).
    if desde := fecha_opcional(params.get("desde")):
        qs = qs.filter(publicado_en__date__gte=desde)
    if hasta := fecha_opcional(params.get("hasta")):
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
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

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

    def _fila(self, articulo: Articulo) -> dict:
        articulo = self.get_queryset().get(pk=articulo.pk)
        return FilaPanelSerializer(articulo, context=self.get_serializer_context()).data

    @action(detail=True, methods=["post"])
    def estado(self, request, pk=None):
        nuevo = serializers.CharField().run_validation(request.data.get("estado"))
        articulo = services.cambiar_estado(self.get_object(), nuevo, request.user)
        return Response(self._fila(articulo))

    @action(detail=True, methods=["post"])
    def vender(self, request, pk=None):
        cantidad = serializers.IntegerField(min_value=1).run_validation(
            request.data.get("cantidad", 1)
        )
        articulo = self.get_object()
        venta = services.vender(articulo, request.user, cantidad)
        return Response(
            {"venta_id": venta.id, "articulo": self._fila(articulo)},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="deshacer-venta")
    def deshacer_venta(self, request, pk=None):
        articulo = self.get_object()
        entrada = DeshacerVentaSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        services.deshacer_ultima_venta(
            articulo, request.user, entrada.validated_data.get("venta_id")
        )
        return Response(self._fila(articulo))

    @action(detail=True, methods=["get"])
    def marketplace(self, request, pk=None):
        """Casillas y descripción para Facebook Marketplace (se pegan a mano)."""
        return Response(texto_marketplace(self.get_object()))

    @action(detail=True, methods=["put"])
    def fotos(self, request, pk=None):
        entrada = FotoEntradaSerializer(data=request.data, many=True)
        entrada.is_valid(raise_exception=True)
        nuevas = services.guardar_fotos(self.get_object(), entrada.validated_data, request.user)
        return Response([foto_json(f) for f in nuevas])


class DeshacerVentaSerializer(serializers.Serializer):
    venta_id = serializers.IntegerField(required=False, min_value=1)


class FirmaFotosView(APIView):
    """Firma para que el navegador suba directo a Cloudinary."""

    permission_classes = [tiene_alguno(ARTICULOS_CREAR, ARTICULOS_EDITAR)]

    def post(self, request):
        return Response(obtener_almacen().firmar_subida())
