from django.core.validators import URLValidator
from django.db import transaction
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.comun.permisos import tiene_permiso
from apps.comun.revalidacion import revalidar_al_confirmar
from apps.comun.serializers import TextoOpcional
from apps.cuentas.permisos import ARTICULOS_VER, CONFIGURACION_EDITAR

from .models import ConfiguracionNegocio, HorarioAtencion
from .views import configuracion_json

WHATSAPP_INVALIDO = "Escribí el número con código de país, solo dígitos."


class HorarioSerializer(serializers.Serializer):
    dia_semana = serializers.IntegerField(min_value=0, max_value=6)
    apertura = serializers.TimeField(format="%H:%M")
    cierre = serializers.TimeField(format="%H:%M")

    def validate(self, datos):
        if datos["apertura"] >= datos["cierre"]:
            raise serializers.ValidationError({"cierre": "Debe ser después de la apertura."})
        return datos


class PreguntaFrecuenteSerializer(serializers.Serializer):
    pregunta = serializers.CharField(max_length=160)
    respuesta = serializers.CharField(max_length=1000)


class RedSocialSerializer(serializers.Serializer):
    red = serializers.CharField(max_length=60)
    url = serializers.CharField(
        max_length=500, validators=[URLValidator(schemes=["http", "https"])]
    )


class ConfiguracionSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=80)
    logo_public_id = serializers.CharField(max_length=255, allow_blank=True, required=False)
    whatsapp = serializers.RegexField(r"^\d{8,15}$", error_messages={"invalid": WHATSAPP_INVALIDO})
    direccion = serializers.CharField(max_length=200)
    mapa_url = serializers.URLField(max_length=500, allow_blank=True, required=False)
    garantia_repuestos = TextoOpcional(max_length=1000)
    condiciones_devolucion = TextoOpcional(max_length=1000)
    metodos_entrega = TextoOpcional(max_length=1000)
    metodos_pago = TextoOpcional(max_length=1000)
    condiciones_compra = TextoOpcional(max_length=1000)
    horarios = HorarioSerializer(many=True)
    preguntas_frecuentes = PreguntaFrecuenteSerializer(many=True, required=False, max_length=20)
    redes_sociales = RedSocialSerializer(many=True, required=False, max_length=20)


@transaction.atomic
def guardar_configuracion(datos: dict) -> ConfiguracionNegocio:
    horarios = datos.pop("horarios")
    config = ConfiguracionNegocio.obtener()
    for campo, valor in datos.items():
        setattr(config, campo, valor)
    config.save()
    config.horarios.all().delete()
    HorarioAtencion.objects.bulk_create(
        HorarioAtencion(configuracion=config, **h) for h in horarios
    )
    revalidar_al_confirmar("configuracion")
    return config


class ConfiguracionPanelView(APIView):
    permission_classes = [tiene_permiso(ARTICULOS_VER)]

    def get_permissions(self):
        clases = list(self.permission_classes)
        if self.request.method == "PUT":
            clases.append(tiene_permiso(CONFIGURACION_EDITAR))
        return [c() for c in clases]

    def get(self, request):
        return Response(configuracion_json(ConfiguracionNegocio.obtener()))

    def put(self, request):
        entrada = ConfiguracionSerializer(data=request.data)
        entrada.is_valid(raise_exception=True)
        return Response(configuracion_json(guardar_configuracion(entrada.validated_data)))
