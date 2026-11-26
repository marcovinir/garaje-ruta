"""Lecturas del catálogo público: visibilidad, filtros, búsqueda y orden (§10)."""

from collections.abc import Mapping

from django.contrib.postgres.search import (
    SearchQuery,
    SearchRank,
    SearchVector,
    TrigramWordSimilarity,
)
from django.db.models import Count, F, Prefetch, Q, QuerySet

from apps.catalogos.models import CategoriaPieza

from .models import Articulo, Compatibilidad, EstadoArticulo, TipoArticulo

CONFIG_BUSQUEDA = "es_unaccent"
SIMILITUD_MINIMA = 0.3
MAX_TERMINOS = 6
# Por palabra se exige más parecido: con 0.3, «accnt» se «parece» a cualquier título con «a».
SIMILITUD_TERMINO = 0.45
ORDENES = {
    "recientes": ["-publicado_en", "-id"],
    "precio_asc": ["precio_colones", "-publicado_en"],
    "precio_desc": ["-precio_colones", "-publicado_en"],
}


def compatibilidades_con_modelo():
    return Prefetch(
        "repuesto__compatibilidades",
        queryset=Compatibilidad.objects.select_related("modelo__marca"),
    )


def visibles_publico() -> QuerySet[Articulo]:
    """Disponibles; un repuesto, además, con cantidad > 0. Reservados y agotados no salen."""
    return (
        Articulo.objects.filter(estado=EstadoArticulo.DISPONIBLE)
        .exclude(tipo=TipoArticulo.REPUESTO, repuesto__cantidad=0)
        .select_related(
            "auto__modelo__marca",
            "auto__transmision",
            "auto__combustible",
            "auto__traccion",
            "auto__carroceria",
            "repuesto__categoria_pieza__padre",
        )
        .prefetch_related(
            "fotos",
            compatibilidades_con_modelo(),
        )
    )


def descendientes(categoria: CategoriaPieza) -> list[int]:
    """Ids de la categoría y de todas sus hijas (el árbol tiene a lo sumo 3 niveles)."""
    ids = [categoria.id]
    nivel = [categoria.id]
    while nivel:
        nivel = list(CategoriaPieza.objects.filter(padre_id__in=nivel).values_list("id", flat=True))
        ids += nivel
    return ids


def _entero(valor: str | None) -> int | None:
    try:
        return int(valor) if valor not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _ids(valor: str | None) -> list[int]:
    return [i for i in (_entero(v.strip()) for v in (valor or "").split(",")) if i is not None]


def _buscar(qs: QuerySet[Articulo], texto: str) -> QuerySet[Articulo]:
    vector = (
        SearchVector("titulo", weight="A", config=CONFIG_BUSQUEDA)
        + SearchVector("auto__modelo__nombre", weight="A", config=CONFIG_BUSQUEDA)
        + SearchVector("auto__modelo__marca__nombre", weight="A", config=CONFIG_BUSQUEDA)
        + SearchVector("repuesto__categoria_pieza__nombre", weight="B", config=CONFIG_BUSQUEDA)
        + SearchVector("repuesto__numero_parte", weight="B", config=CONFIG_BUSQUEDA)
        + SearchVector("descripcion", weight="C", config=CONFIG_BUSQUEDA)
    )
    consulta = SearchQuery(texto, config=CONFIG_BUSQUEDA)
    qs = qs.annotate(
        rango=SearchRank(vector, consulta),
        similitud=TrigramWordSimilarity(texto, "titulo"),
        coincide=vector,
    )
    # Cada palabra tiene que aparecer (o parecerse a una del título): «alternador accent»
    # no trae todos los alternadores.
    for n, termino in enumerate(texto.split()[:MAX_TERMINOS]):
        parecido = f"parecido_{n}"
        qs = qs.annotate(**{parecido: TrigramWordSimilarity(termino, "titulo")}).filter(
            Q(coincide=SearchQuery(termino, config=CONFIG_BUSQUEDA))
            | Q(**{f"{parecido}__gt": SIMILITUD_TERMINO})
        )
    return qs


def filtrar_catalogo(qs: QuerySet[Articulo], params: Mapping[str, str]) -> QuerySet[Articulo]:
    """Aplica los filtros del §10. Un valor inválido se ignora; nunca produce un error."""
    tipo = params.get("tipo")
    if tipo in TipoArticulo.values:
        qs = qs.filter(tipo=tipo)

    rangos = {
        "anio_min": "auto__anio__gte",
        "anio_max": "auto__anio__lte",
        "precio_min": "precio_colones__gte",
        "precio_max": "precio_colones__lte",
        "km_max": "auto__kilometraje__lte",
    }
    ids_directos = {
        "marca": "auto__modelo__marca_id",
        "modelo": "auto__modelo_id",
        "transmision": "auto__transmision_id",
        "combustible": "auto__combustible_id",
        "traccion": "auto__traccion_id",
    }
    for parametro, campo in {**rangos, **ids_directos}.items():
        valor = _entero(params.get(parametro))
        if valor is not None:
            qs = qs.filter(**{campo: valor})

    if carroceria := params.get("carroceria"):
        qs = qs.filter(auto__carroceria__slug=carroceria)
    if (condicion := params.get("condicion")) in ("nuevo", "usado"):
        qs = qs.filter(repuesto__condicion=condicion)
    if params.get("ofertas") == "1":
        qs = qs.filter(precio_anterior_colones__isnull=False)
    if slug := params.get("categoria"):
        categoria = CategoriaPieza.objects.filter(slug=slug).first()
        qs = qs.filter(
            repuesto__categoria_pieza_id__in=descendientes(categoria) if categoria else []
        )

    if equipamiento := _ids(params.get("equipamiento")):
        qs = qs.filter(auto__equipamiento__id__in=equipamiento)
        qs = qs.annotate(con_equipamiento=Count("auto__equipamiento", distinct=True)).filter(
            con_equipamiento=len(set(equipamiento))
        )

    compatibles = Q()
    if (marca := _entero(params.get("compatible_marca"))) is not None:
        compatibles &= Q(repuesto__compatibilidades__modelo__marca_id=marca)
    if (modelo := _entero(params.get("compatible_modelo"))) is not None:
        compatibles &= Q(repuesto__compatibilidades__modelo_id=modelo)
    if (anio := _entero(params.get("compatible_anio"))) is not None:
        compatibles &= Q(repuesto__compatibilidades__anio_desde__lte=anio) & Q(
            repuesto__compatibilidades__anio_hasta__gte=anio
        )
    if compatibles:
        # Un solo filter(): marca, modelo y año deben cumplirse en la misma compatibilidad.
        qs = qs.filter(compatibles).distinct()

    orden = params.get("orden")
    if texto := (params.get("q") or "").strip():
        qs = _buscar(qs, texto)
        if orden not in ORDENES:
            return qs.order_by(F("rango").desc(), F("similitud").desc(), "-publicado_en")
    return qs.order_by(*ORDENES.get(orden, ORDENES["recientes"]))


def estado_publico(articulo: Articulo) -> str:
    """disponible | reservado | vendido | agotado | no_disponible (oculto)."""
    if articulo.estado == EstadoArticulo.OCULTO:
        return "no_disponible"
    if articulo.estado == EstadoArticulo.VENDIDO:
        return "vendido"
    if articulo.agotado:
        return "agotado"
    return articulo.estado


def similares(articulo: Articulo, limite: int = 3) -> list[Articulo]:
    """§7: del mismo tipo y visibles, por niveles de parecido; se completa con destacados."""
    base = visibles_publico().filter(tipo=articulo.tipo).exclude(id=articulo.id)
    if articulo.tipo == TipoArticulo.AUTO:
        auto = articulo.auto
        margen = articulo.precio_colones * 3 // 10
        niveles = [
            base.filter(auto__modelo_id=auto.modelo_id),
            base.filter(auto__modelo__marca_id=auto.modelo.marca_id),
            base.filter(
                precio_colones__gte=articulo.precio_colones - margen,
                precio_colones__lte=articulo.precio_colones + margen,
            ),
        ]
    else:
        repuesto = articulo.repuesto
        modelos = {c.modelo_id for c in repuesto.compatibilidades.all()}
        misma_categoria = base.filter(repuesto__categoria_pieza_id=repuesto.categoria_pieza_id)
        niveles = [
            misma_categoria.filter(repuesto__compatibilidades__modelo_id__in=modelos).distinct(),
            misma_categoria,
        ]
    niveles += [base.filter(destacado=True), base]

    elegidos: list[Articulo] = []
    for nivel in niveles:
        faltan = limite - len(elegidos)
        if not faltan:
            break
        elegidos.extend(
            nivel.exclude(id__in=[a.id for a in elegidos]).order_by("-publicado_en", "-id")[:faltan]
        )
    return elegidos


def articulo_con_relaciones() -> QuerySet[Articulo]:
    return Articulo.objects.select_related(
        "auto__modelo__marca",
        "auto__transmision",
        "auto__combustible",
        "auto__traccion",
        "auto__carroceria",
        "repuesto__categoria_pieza__padre",
    ).prefetch_related("fotos", "auto__equipamiento__grupo", compatibilidades_con_modelo())
