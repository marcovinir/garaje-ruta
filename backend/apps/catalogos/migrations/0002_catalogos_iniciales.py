from django.db import migrations

from apps.catalogos import semillas


def sembrar(apps, schema_editor):
    for modelo, nombres in (
        ("Transmision", semillas.TRANSMISIONES),
        ("Combustible", semillas.COMBUSTIBLES),
        ("Traccion", semillas.TRACCIONES),
    ):
        clase = apps.get_model("catalogos", modelo)
        for nombre in nombres:
            clase.objects.get_or_create(nombre=nombre)

    Carroceria = apps.get_model("catalogos", "Carroceria")
    for orden, (nombre, slug) in enumerate(semillas.CARROCERIAS, start=1):
        Carroceria.objects.update_or_create(slug=slug, defaults={"nombre": nombre, "orden": orden})

    Grupo = apps.get_model("catalogos", "GrupoEquipamiento")
    Equipamiento = apps.get_model("catalogos", "Equipamiento")
    for orden_grupo, (grupo_nombre, items) in enumerate(semillas.EQUIPAMIENTO.items(), start=1):
        grupo, _ = Grupo.objects.update_or_create(
            nombre=grupo_nombre, defaults={"orden": orden_grupo}
        )
        for orden, item in enumerate(items, start=1):
            Equipamiento.objects.update_or_create(
                nombre=item.removesuffix("★").strip(),
                defaults={"grupo": grupo, "orden": orden, "filtrable": item.endswith("★")},
            )

    CategoriaPieza = apps.get_model("catalogos", "CategoriaPieza")
    for nombre, slug in semillas.CATEGORIAS_PIEZA_RAIZ:
        CategoriaPieza.objects.update_or_create(slug=slug, defaults={"nombre": nombre})


def deshacer(apps, schema_editor):
    for modelo in (
        "Equipamiento",
        "GrupoEquipamiento",
        "Carroceria",
        "Traccion",
        "Combustible",
        "Transmision",
    ):
        apps.get_model("catalogos", modelo).objects.all().delete()
    apps.get_model("catalogos", "CategoriaPieza").objects.filter(padre__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [("catalogos", "0001_initial")]

    operations = [migrations.RunPython(sembrar, deshacer)]
