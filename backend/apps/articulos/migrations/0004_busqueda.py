from django.contrib.postgres.indexes import GinIndex, OpClass
from django.db import migrations

CREAR_CONFIG = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'es_unaccent') THEN
        CREATE TEXT SEARCH CONFIGURATION es_unaccent (COPY = spanish);
        ALTER TEXT SEARCH CONFIGURATION es_unaccent
            ALTER MAPPING FOR word, hword, hword_part, asciiword, asciihword, hword_asciipart
            WITH unaccent, spanish_stem;
    END IF;
END
$$;
"""
BORRAR_CONFIG = "DROP TEXT SEARCH CONFIGURATION IF EXISTS es_unaccent;"


class Migration(migrations.Migration):
    """Búsqueda sin tildes (es_unaccent) y por parecido del título (índice trigram)."""

    dependencies = [("articulos", "0003_restricciones_de_opciones")]

    operations = [
        migrations.RunSQL(CREAR_CONFIG, BORRAR_CONFIG),
        migrations.AddIndex(
            model_name="articulo",
            index=GinIndex(
                OpClass("titulo", name="gin_trgm_ops"), name="articulo_titulo_trgm"
            ),
        ),
    ]
