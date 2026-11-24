from datetime import time

from django.db import migrations

# WhatsApp ficticio: se cambia desde el panel (configuración del negocio).
CONFIGURACION = {
    "nombre": "Garaje Ruta",
    "whatsapp": "50600000000",
    "direccion": "Heredia, Costa Rica",
}
HORARIOS = [(dia, time(8), time(17)) for dia in range(5)] + [(5, time(8), time(12))]


def sembrar(apps, schema_editor):
    Configuracion = apps.get_model("negocio", "ConfiguracionNegocio")
    Horario = apps.get_model("negocio", "HorarioAtencion")
    config, creada = Configuracion.objects.get_or_create(pk=1, defaults=CONFIGURACION)
    if creada:
        for dia, apertura, cierre in HORARIOS:
            Horario.objects.create(
                configuracion=config, dia_semana=dia, apertura=apertura, cierre=cierre
            )


def deshacer(apps, schema_editor):
    apps.get_model("negocio", "ConfiguracionNegocio").objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [("negocio", "0001_initial")]

    operations = [migrations.RunPython(sembrar, deshacer)]
