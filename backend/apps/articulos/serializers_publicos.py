"""Lo que ve el público de un artículo. El tipo de cambio llega en el contexto."""

from rest_framework import serializers

from .models import Articulo, TipoArticulo
from .presentacion import precio_usd, ruta_publica


def foto_json(foto) -> dict | None:
    if foto is None:
        return None
    return {"public_id": foto.public_id, "ancho": foto.ancho, "alto": foto.alto}


def resumen_compatibilidad(repuesto) -> str:
    compatibilidades = sorted(
        repuesto.compatibilidades.all(), key=lambda c: (c.anio_desde, c.modelo.nombre)
    )
    if not compatibilidades:
        return ""
    primera = compatibilidades[0]
    texto = f"{primera.modelo.nombre} {primera.anio_desde}–{primera.anio_hasta}"
    resto = len(compatibilidades) - 1
    return f"{texto} y {resto} más" if resto else texto


class TarjetaSerializer(serializers.ModelSerializer):
    ruta = serializers.SerializerMethodField()
    precio_usd = serializers.SerializerMethodField()
    foto = serializers.SerializerMethodField()
    auto = serializers.SerializerMethodField()
    repuesto = serializers.SerializerMethodField()

    class Meta:
        model = Articulo
        fields = [
            "id",
            "tipo",
            "titulo",
            "ruta",
            "precio_colones",
            "precio_anterior_colones",
            "precio_usd",
            "foto",
            "auto",
            "repuesto",
        ]

    def get_ruta(self, articulo: Articulo) -> str:
        return ruta_publica(articulo)

    def get_precio_usd(self, articulo: Articulo) -> int | None:
        return precio_usd(articulo.precio_colones, self.context.get("tipo_cambio"))

    def get_foto(self, articulo: Articulo) -> dict | None:
        # Usa las fotos ya precargadas (prefetch) en vez de otra consulta por tarjeta.
        principal = next((f for f in articulo.fotos.all() if f.orden == 1), None)
        return foto_json(principal)

    def get_auto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.AUTO:
            return None
        auto = articulo.auto
        return {
            "anio": auto.anio,
            "kilometraje": auto.kilometraje,
            "transmision": auto.transmision.nombre,
            "combustible": auto.combustible.nombre,
        }

    def get_repuesto(self, articulo: Articulo) -> dict | None:
        if articulo.tipo != TipoArticulo.REPUESTO:
            return None
        repuesto = articulo.repuesto
        return {
            "condicion": repuesto.condicion,
            "categoria": repuesto.categoria_pieza.nombre,
            "compatibilidad_resumen": resumen_compatibilidad(repuesto),
        }
