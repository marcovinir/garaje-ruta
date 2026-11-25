from django.db import migrations


def renombrar(apps, schema_editor):
    apps.get_model("catalogos", "Transmision").objects.filter(
        nombre="Automática/Dual"
    ).update(nombre="Automática con modo manual")


def deshacer(apps, schema_editor):
    apps.get_model("catalogos", "Transmision").objects.filter(
        nombre="Automática con modo manual"
    ).update(nombre="Automática/Dual")


class Migration(migrations.Migration):
    dependencies = [("catalogos", "0002_catalogos_iniciales")]
    operations = [migrations.RunPython(renombrar, deshacer)]
