"""Catálogos en el panel: el colaborador agrega marcas, modelos y categorías; el admin gestiona."""

from django.db.models import ProtectedError
from django.utils.text import slugify
from rest_framework import serializers, viewsets
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator

from apps.comun.errores import Conflicto
from apps.comun.permisos import tiene_permiso
from apps.cuentas.permisos import ARTICULOS_VER, CATALOGOS_AGREGAR, CATALOGOS_GESTIONAR

from .models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    Equipamiento,
    GrupoEquipamiento,
    Marca,
    Modelo,
    Traccion,
    Transmision,
)

YA_EXISTE = "Ya existe."
EN_USO = "Está en uso: no se puede borrar."
MAX_NIVELES = 3


def _unico(modelo):
    return [UniqueValidator(queryset=modelo.objects.all(), message=YA_EXISTE)]


def _serializer(modelo_, campos: list[str], con_slug: bool = False):
    """Serializer de catálogo con nombre único y, si aplica, slug generado del nombre."""

    class Serializer(serializers.ModelSerializer):
        class Meta:
            model = modelo_
            fields = ["id", *campos]
            extra_kwargs = {"nombre": {"validators": _unico(modelo_)}}
            if con_slug:
                extra_kwargs["slug"] = {"required": False, "validators": _unico(modelo_)}

        def validate(self, datos):
            if con_slug and not datos.get("slug") and "nombre" in datos:
                datos["slug"] = slugify(datos["nombre"])
            return datos

    Serializer.__name__ = f"{modelo_.__name__}PanelSerializer"
    return Serializer


class ModeloPanelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modelo
        fields = ["id", "marca", "nombre", "slug"]
        extra_kwargs = {"slug": {"required": False}}
        validators = [
            UniqueTogetherValidator(
                queryset=Modelo.objects.all(), fields=["marca", "nombre"], message=YA_EXISTE
            )
        ]

    def validate(self, datos):
        if not datos.get("slug") and "nombre" in datos:
            datos["slug"] = slugify(datos["nombre"])
        return datos


def _nivel(categoria: CategoriaPieza | None) -> int:
    nivel = 0
    while categoria is not None:
        nivel += 1
        categoria = categoria.padre
    return nivel


class CategoriaPanelSerializer(_serializer(CategoriaPieza, ["padre", "nombre", "slug"], True)):
    def validate_padre(self, padre):
        if padre is not None and _nivel(padre) >= MAX_NIVELES:
            raise serializers.ValidationError(f"Máximo {MAX_NIVELES} niveles de categorías.")
        return padre


class CatalogoViewSet(viewsets.ModelViewSet):
    """Leer: articulos.ver. Crear: `permiso_crear`. Editar y borrar: catalogos.gestionar."""

    permission_classes = [tiene_permiso(ARTICULOS_VER)]
    permiso_crear = CATALOGOS_GESTIONAR
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    pagination_class = None

    def get_permissions(self):
        extra = {
            "create": self.permiso_crear,
            "partial_update": CATALOGOS_GESTIONAR,
            "destroy": CATALOGOS_GESTIONAR,
        }.get(self.action)
        clases = [*self.permission_classes, *([tiene_permiso(extra)] if extra else [])]
        return [c() for c in clases]

    def perform_destroy(self, instancia):
        try:
            instancia.delete()
        except ProtectedError as error:
            raise Conflicto(EN_USO) from error


def _viewset(modelo_, serializer, permiso_crear=CATALOGOS_GESTIONAR):
    return type(
        f"{modelo_.__name__}PanelViewSet",
        (CatalogoViewSet,),
        {
            "queryset": modelo_.objects.all(),
            "serializer_class": serializer,
            "permiso_crear": permiso_crear,
        },
    )


MarcaViewSet = _viewset(Marca, _serializer(Marca, ["nombre", "slug"], True), CATALOGOS_AGREGAR)
ModeloViewSet = _viewset(Modelo, ModeloPanelSerializer, CATALOGOS_AGREGAR)
CategoriaViewSet = _viewset(CategoriaPieza, CategoriaPanelSerializer, CATALOGOS_AGREGAR)
TransmisionViewSet = _viewset(Transmision, _serializer(Transmision, ["nombre"]))
CombustibleViewSet = _viewset(Combustible, _serializer(Combustible, ["nombre"]))
TraccionViewSet = _viewset(Traccion, _serializer(Traccion, ["nombre"]))
CarroceriaViewSet = _viewset(Carroceria, _serializer(Carroceria, ["nombre", "slug", "orden"], True))
GrupoViewSet = _viewset(GrupoEquipamiento, _serializer(GrupoEquipamiento, ["nombre", "orden"]))
EquipamientoViewSet = _viewset(
    Equipamiento, _serializer(Equipamiento, ["grupo", "nombre", "orden", "filtrable"])
)
