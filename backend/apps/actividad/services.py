"""Escrituras de actividad pública."""

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from .models import VistaDiaria


def registrar_vista(articulo_id: int) -> None:
    """Suma 1 a las vistas de hoy (fecha local) de un artículo visible; si no, no hace nada."""
    from apps.articulos.selectors import visibles_publico

    if not visibles_publico().filter(id=articulo_id).exists():
        return
    hoy = timezone.localdate()
    filtro = VistaDiaria.objects.filter(articulo_id=articulo_id, fecha=hoy)
    if filtro.update(cantidad=F("cantidad") + 1):
        return
    try:
        with transaction.atomic():
            VistaDiaria.objects.create(articulo_id=articulo_id, fecha=hoy, cantidad=1)
    except IntegrityError:
        # Otra petición creó la fila del día entre medio: se suma sobre esa.
        filtro.update(cantidad=F("cantidad") + 1)
