# Respaldo y restauración

La base de producción (Supabase Postgres) tiene dos respaldos:

1. **El diario de Supabase**, incluido en el plan gratis. Se restaura desde el panel de Supabase.
2. **Uno semanal propio:** el workflow [`respaldo.yml`](../.github/workflows/respaldo.yml) corre los domingos a las 4:00 de Costa Rica, hace `pg_dump --format=custom` por el pooler en modo sesión, lo **cifra** y lo guarda como artefacto de GitHub durante 30 días. También se puede lanzar a mano desde *Actions*.

**El respaldo va cifrado y sin sesiones.** El repo es público, y cualquier cuenta de GitHub puede descargar los artefactos de un repo público. Por eso:

- se cifra con GPG (AES256) con la clave del secret `RESPALDO_CLAVE`, que solo tiene Marco (guardala también en tu gestor de contraseñas: sin ella el respaldo no sirve). Si el secret falta, el workflow falla en vez de subirlo sin cifrar;
- no lleva los datos de `django_session` ni de `cache_django`: una sesión robada daría acceso al panel. Las tablas sí se crean, vacías.

El respaldo semanal tiene sentido aunque esté el de Supabase: vive fuera de Supabase, se puede restaurar en cualquier Postgres, y su restauración está probada (abajo).

## Restaurar un respaldo en local

Necesitás el Postgres de Docker del proyecto (`docker compose up -d db`) y el CLI de GitHub (`gh`).

1. **Elegir, descargar y descifrar el respaldo**, en una carpeta temporal fuera del repo. `gpg` pide la clave de `RESPALDO_CLAVE` (Git for Windows ya trae `gpg`):

   ```bash
   gh run list --workflow respaldo.yml --limit 5
   gh run download <id-de-la-corrida> --dir "$TEMP/respaldo-garaje"
   cd "$TEMP/respaldo-garaje/respaldo-AAAA-MM-DD.dump.gpg"
   gpg --output respaldo-AAAA-MM-DD.dump --decrypt respaldo-AAAA-MM-DD.dump.gpg
   ```

2. **Crear una base aparte** (nunca sobre la de desarrollo):

   ```bash
   docker compose exec -T db createdb -U postgres garaje_ruta_restaurada
   ```

3. **Restaurar.** `pg_restore` corre dentro del contenedor; el archivo entra por la entrada estándar:

   ```bash
   docker compose exec -T db pg_restore -U postgres --no-owner --no-privileges \
     --dbname garaje_ruta_restaurada < "$TEMP/respaldo-garaje/respaldo-AAAA-MM-DD.dump.gpg/respaldo-AAAA-MM-DD.dump"
   ```

   Los avisos y errores sobre los esquemas propios de Supabase (`auth`, `storage`, `extensions`, `vault`…) son esperables: `pg_restore` termina con «errors ignored on restore». Lo que importa son las tablas de la app, en `public`.

4. **Comprobar** que los datos están:

   ```bash
   docker compose exec -T db psql -U postgres -d garaje_ruta_restaurada -c \
     "select (select count(*) from articulo) articulos, (select count(*) from venta) ventas, (select count(*) from usuario) usuarios;"
   docker compose run --rm -e DATABASE_URL=postgres://postgres:postgres@db:5432/garaje_ruta_restaurada \
     backend python manage.py showmigrations --plan | tail -3
   ```

   Los conteos tienen que coincidir con los de producción el día del respaldo, y las migraciones tienen que aparecer aplicadas (`[X]`).

5. **Limpiar:** el archivo tiene datos de producción, aunque sean ficticios.

   ```bash
   docker compose exec -T db dropdb -U postgres garaje_ruta_restaurada
   rm -r "$TEMP/respaldo-garaje"
   ```

## Restaurar en producción (emergencia)

Primero, el respaldo diario de Supabase, desde su panel. Si no sirve, crear un proyecto nuevo de Supabase, descifrar el respaldo (paso 1) y restaurar el `.dump` con `pg_restore` sobre la URL del pooler en modo sesión (puerto 5432), con los mismos pasos 3 y 4. Después hay que cambiar `DATABASE_URL` en Vercel y `DATABASE_URL_MIGRACIONES` en GitHub, y correr `migrar.yml` sin sembrar.

## Pruebas de restauración

| Fecha | Respaldo | Resultado |
|---|---|---|
| 2026-11-24 | `respaldo-2026-11-25.dump` (corrida 45540472655, 434 KB) | ✅ Restaurado en `garaje_ruta_restaurada` (Postgres 18 de Docker). 3 errores ignorados, todos de `vault` (esquema de Supabase). Conteos: 120 artículos, 196 ventas, 3 usuarios, 3940 vistas, 60 tipos de cambio y 255 fotos: los del sembrado (195 ventas) más una venta de prueba de Marco hecha antes del respaldo. `manage.py check` sin problemas, todas las migraciones aplicadas y `migrate --check` sin pendientes. Base y archivo borrados. |

El 2026-11-25 la revisión final del Plan 5 detectó que el respaldo de la primera prueba (sin cifrar, con sesiones) era descargable por cualquier cuenta de GitHub. Se borró el artefacto, se rotó `SECRET_KEY` en Vercel para cerrar todas las sesiones y desde entonces el respaldo va cifrado y sin sesiones.
