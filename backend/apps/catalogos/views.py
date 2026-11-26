from django.db.models import Prefetch
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    GrupoEquipamiento,
    Marca,
    Modelo,
    Traccion,
    Transmision,
)
from .presentacion import nombre_modelo


def _simples(modelo) -> list[dict]:
    return [{"id": o.id, "nombre": o.nombre} for o in modelo.objects.all()]


def _categoria(categoria: CategoriaPieza, hijas_por_padre: dict) -> dict:
    return {
        "id": categoria.id,
        "nombre": categoria.nombre,
        "slug": categoria.slug,
        "hijas": [_categoria(h, hijas_por_padre) for h in hijas_por_padre.get(categoria.id, [])],
    }


def catalogos_json() -> dict:
    """Todo lo que necesitan los filtros y formularios, en una sola respuesta."""
    marcas = (
        Marca.objects.filter(modelos__isnull=False)
        .distinct()
        .prefetch_related(Prefetch("modelos", queryset=Modelo.objects.order_by("nombre")))
    )
    categorias = list(CategoriaPieza.objects.all())
    hijas_por_padre: dict[int, list] = {}
    for c in categorias:
        if c.padre_id:
            hijas_por_padre.setdefault(c.padre_id, []).append(c)
    grupos = GrupoEquipamiento.objects.prefetch_related("equipamientos")
    return {
        "marcas": [
            {
                "id": m.id,
                "nombre": m.nombre,
                "slug": m.slug,
                "modelos": [
                    {
                        "id": mo.id,
                        "nombre": mo.nombre,
                        "slug": mo.slug,
                        "nombre_vehiculo": nombre_modelo(m.nombre, mo.nombre),
                    }
                    for mo in m.modelos.all()
                ],
            }
            for m in marcas
        ],
        "categorias": [_categoria(c, hijas_por_padre) for c in categorias if c.padre_id is None],
        "transmisiones": _simples(Transmision),
        "combustibles": _simples(Combustible),
        "tracciones": _simples(Traccion),
        "carrocerias": [
            {"id": c.id, "nombre": c.nombre, "slug": c.slug} for c in Carroceria.objects.all()
        ],
        "equipamiento": [
            {
                "grupo": g.nombre,
                "items": [
                    {"id": e.id, "nombre": e.nombre, "filtrable": e.filtrable}
                    for e in sorted(g.equipamientos.all(), key=lambda e: (e.orden, e.nombre))
                ],
            }
            for g in grupos
        ],
    }


class CatalogosView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "publico"

    def get(self, request):
        return Response(catalogos_json())
