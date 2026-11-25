from rest_framework import serializers


class TextoOpcional(serializers.CharField):
    """Normaliza el texto vacío a null y distingue omisión de borrado."""

    def __init__(self, **opciones):
        super().__init__(required=False, allow_null=True, allow_blank=True, **opciones)

    def run_validation(self, data=serializers.empty):
        return super().run_validation(data) or None
