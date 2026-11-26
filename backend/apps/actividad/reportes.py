from calendar import monthrange
from datetime import date, timedelta

from django.db.models import BigIntegerField, Count, F, FilteredRelation, Q, Sum
from django.db.models.functions import Cast, TruncMonth
from django.utils import timezone
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.articulos.models import Articulo, EstadoArticulo, TipoArticulo
from apps.articulos.presentacion import ruta_publica
from apps.comun.permisos import tiene_permiso
from apps.cuentas.permisos import REPORTES_VER

from .models import EventoComercial, TipoEvento, Venta


def meses_antes(fecha: date, meses: int) -> date:
    anio, mes = divmod(fecha.year * 12 + fecha.month - 1 - meses, 12)
    return date(anio, mes + 1, min(fecha.day, monthrange(anio, mes + 1)[1]))


class RangoReporte(serializers.Serializer):
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)

    def validate(self, datos):
        hasta = datos.get("hasta", timezone.localdate())
        desde = datos.get("desde")
        if desde is None:
            desde = meses_antes(hasta, 6) if hasta.year > 1 or hasta.month > 6 else date.min
        if desde > hasta:
            raise serializers.ValidationError(
                "La fecha desde debe ser anterior o igual a la fecha hasta."
            )
        return {"desde": desde, "hasta": hasta}


def ventas_del_rango(desde: date, hasta: date):
    tramo_valido = Q(articulo__tipo=TipoArticulo.AUTO, fecha__gte=F("articulo__publicado_en"))
    grupos = (
        Venta.objects.filter(fecha__date__range=(desde, hasta))
        .annotate(mes=TruncMonth("fecha"))
        .values("mes", "articulo__tipo")
        .annotate(
            unidades=Sum("cantidad"),
            monto=Sum(Cast("precio_unitario_colones", BigIntegerField()) * F("cantidad")),
            autos_con_publicacion=Count("id", filter=tramo_valido),
            duracion=Sum(F("fecha") - F("articulo__publicado_en"), filter=tramo_valido),
        )
        .order_by("mes", "articulo__tipo")
    )
    meses = {}
    cantidad = monto = autos = 0
    duracion = timedelta(0)
    for grupo in grupos:
        mes = grupo["mes"].strftime("%Y-%m")
        fila = meses.setdefault(
            mes,
            {
                "mes": mes,
                "auto": {"cantidad": 0, "monto": 0},
                "repuesto": {"cantidad": 0, "monto": 0},
            },
        )
        fila[grupo["articulo__tipo"]] = {"cantidad": grupo["unidades"], "monto": grupo["monto"]}
        cantidad += grupo["unidades"]
        monto += grupo["monto"]
        if grupo["duracion"] is not None:
            autos += grupo["autos_con_publicacion"]
            duracion += grupo["duracion"]
    promedio = round(duracion / timedelta(days=1) / autos, 1) if autos else None
    return {"cantidad": cantidad, "monto": monto, "dias_promedio": promedio}, list(meses.values())


def ranking(relacion, condicion, total):
    articulos = (
        Articulo.objects.select_related("repuesto")
        .only("pk", "titulo", "tipo", "estado", "repuesto__cantidad")
        .annotate(registros=FilteredRelation(relacion, condition=condicion))
        .annotate(total=total)
        .filter(total__gt=0)
        .order_by("-total", "pk")[:10]
    )
    return [
        {
            "id": articulo.pk,
            "titulo": articulo.titulo,
            "ruta": ruta_publica(articulo),
            "tipo": articulo.tipo,
            "estado": (
                "agotado"
                if articulo.estado != EstadoArticulo.OCULTO and articulo.agotado
                else articulo.estado
            ),
            "total": articulo.total,
        }
        for articulo in articulos
    ]


class ReportesPanelView(APIView):
    permission_classes = [tiene_permiso(REPORTES_VER)]

    def get(self, request):
        rango = RangoReporte(data=request.query_params)
        rango.is_valid(raise_exception=True)
        desde, hasta = rango.validated_data["desde"], rango.validated_data["hasta"]
        ventas, por_mes = ventas_del_rango(desde, hasta)
        fechas = (desde, hasta)
        interes = EventoComercial.objects.filter(fecha__date__range=fechas).aggregate(
            consultas=Count("id", filter=Q(tipo=TipoEvento.CLIC_WHATSAPP)),
            visitas=Count("id", filter=Q(tipo=TipoEvento.PEDIDO_VISITA)),
            compatibilidad=Count("id", filter=Q(tipo=TipoEvento.PEDIDO_COMPATIBILIDAD)),
        )
        return Response(
            {
                "desde": desde,
                "hasta": hasta,
                "ventas": ventas,
                "ventas_por_mes": por_mes,
                "interes": interes,
                "mas_vistos": ranking(
                    "vistas", Q(vistas__fecha__range=fechas), Sum("registros__cantidad")
                ),
                "mas_consultados": ranking(
                    "eventos",
                    Q(eventos__fecha__date__range=fechas, eventos__tipo=TipoEvento.CLIC_WHATSAPP),
                    Count("registros"),
                ),
            }
        )
