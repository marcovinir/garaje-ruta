from django.contrib.postgres.operations import TrigramExtension, UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):
    """Extensiones para la búsqueda sin tildes y con errores leves (Plan 2)."""

    operations = [UnaccentExtension(), TrigramExtension()]
