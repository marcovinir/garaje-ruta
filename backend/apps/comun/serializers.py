from datetime import date

from django.utils.dateparse import parse_date
from rest_framework import serializers


def fecha_opcional(valor: str | None) -> date | None:
    try:
        return parse_date(valor or "")
    except ValueError:
        return None


class TextoOpcional(serializers.CharField):
    """Normaliza el texto vacío a null y distingue omisión de borrado."""

    def __init__(self, **opciones):
        super().__init__(required=False, allow_null=True, allow_blank=True, **opciones)

    def run_validation(self, data=serializers.empty):
        return super().run_validation(data) or None
