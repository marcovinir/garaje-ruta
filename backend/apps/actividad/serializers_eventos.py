import json

from rest_framework import serializers

from apps.articulos.models import Articulo, EstadoArticulo

from .models import DispositivoEvento, EventoComercial, TipoEvento

PAGINAS = {
    "inicio",
    "autos",
    "repuestos",
    "ficha_auto",
    "ficha_repuesto",
    "contacto",
    "buscar",
    "otra",
}
SECCIONES = {
    "encabezado",
    "ficha",
    "flotante",
    "pie",
    "contacto",
    "ofertas",
    "filtros",
    "compatibilidad",
}
FILTROS = {
    "q",
    "precio_min",
    "precio_max",
    "ofertas",
    "marca",
    "modelo",
    "anio_min",
    "anio_max",
    "km_max",
    "transmision",
    "combustible",
    "traccion",
    "carroceria",
    "equipamiento",
    "categoria",
    "condicion",
    "compatible_marca",
    "compatible_modelo",
    "compatible_anio",
}


class EventoComercialSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=TipoEvento.choices)
    articulo = serializers.IntegerField(min_value=1, max_value=2**63 - 1, required=False)
    dispositivo = serializers.ChoiceField(choices=DispositivoEvento.choices)
    contexto = serializers.DictField(required=False, default=dict)

    def to_internal_value(self, data):
        if isinstance(data, dict) and data.keys() - self.fields.keys():
            raise serializers.ValidationError(
                {"non_field_errors": ["El evento contiene campos no admitidos."]}
            )
        return super().to_internal_value(data)

    def validate_articulo(self, valor):
        articulo = (
            Articulo.objects.exclude(estado=EstadoArticulo.OCULTO)
            .filter(pk=valor)
            .only("id")
            .first()
        )
        if articulo is None:
            raise serializers.ValidationError("El artículo no está disponible.")
        return articulo

    def validate_contexto(self, contexto):
        if contexto.keys() - {"pagina", "seccion", "filtros"}:
            raise serializers.ValidationError("El contexto contiene campos no admitidos.")
        if len(json.dumps(contexto, separators=(",", ":"))) > 512:
            raise serializers.ValidationError("El contexto es demasiado grande.")
        for clave, opciones in (("pagina", PAGINAS), ("seccion", SECCIONES)):
            if clave in contexto:
                valor = contexto[clave]
                if not isinstance(valor, str) or valor not in opciones:
                    raise serializers.ValidationError(f"El valor de {clave} no está admitido.")
        if "filtros" in contexto:
            filtros = contexto["filtros"]
            if (
                not isinstance(filtros, list)
                or len(filtros) > len(FILTROS)
                or any(not isinstance(filtro, str) or filtro not in FILTROS for filtro in filtros)
                or len(set(filtros)) != len(filtros)
            ):
                raise serializers.ValidationError(
                    "Enviá solo los nombres de los filtros admitidos."
                )
        return contexto

    def create(self, validated_data):
        return EventoComercial.objects.create(**validated_data)
