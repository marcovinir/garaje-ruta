# Plan 1 — Cimientos: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dejar listo el repo en GitHub con CI, Docker Compose de desarrollo, los esqueletos del backend y del frontend, las cuentas del panel traídas de Sonrisa Viva (roles Admin, Colaborador y Demo), **todo el modelo de datos del §6 del diseño** con sus restricciones, y los datos de ejemplo.

**Architecture:** monorepo con `backend/` (Django + DRF; apps por dominio con `services.py` y `selectors.py`) y `frontend/` (Next.js App Router). En desarrollo, `docker compose up` levanta Postgres 18 y Django; Next.js corre con `npm run dev` y reenvía `/api/*` a Django. Las piezas de cuentas y comunes se **copian y adaptan** desde `C:\Users\marco\Proyectos\sonrisa-viva\backend` (repo `marcovinir/sonrisa-viva`), junto con sus pruebas.

**Tech Stack:**
- Backend: Python 3.12, Django 5.2 LTS, DRF 3.16, psycopg 3, dj-database-url, python-dotenv, pytest + pytest-django, time-machine, ruff.
- Frontend: Node 24, Next.js (la versión que instale `create-next-app`), React, TypeScript, Tailwind CSS v4, Vitest + Testing Library, ESLint y Prettier.
- Desarrollo: Docker 29 + Docker Compose v5 (ya instalados en la máquina de Marco).

**Spec:** `docs/superpowers/specs/2026-11-23-garaje-ruta-design.md`

**Plan dentro de la serie:**
- **Plan 1 (este):** fases 0 y 2 del diseño (cimientos y modelos).
- **Plan 2:** fases 3 a 5 (API pública, API del panel con fotos y ventas, tipo de cambio).
- **Plan 3:** fase 6 (web pública), después de los mockups aprobados.
- **Plan 4:** fase 7 (panel), después de los mockups aprobados.
- **Plan 5:** fase 8 (despliegue, E2E, Lighthouse, respaldo y README).
- **Fase 1 (mockups en Claude Design):** en paralelo, no es código.

## Global Constraints

- **Python 3.12** (lo que soporta Vercel). Imagen de Docker `python:3.12-slim`; venv local opcional con `py -3.12 -m venv backend/.venv`.
- `LANGUAGE_CODE = "es"`, `TIME_ZONE = "America/Costa_Rica"`, `USE_TZ = True`.
- Modelos, campos, tablas (`db_table` explícito en singular `snake_case`), URLs y mensajes en **español**. Clases en `PascalCase`.
- La base se configura solo con `DATABASE_URL`. Desarrollo: `postgres://postgres:postgres@localhost:5433/garaje_ruta` (el Postgres de Docker publica el **5433** para no chocar con el PostgreSQL 18 de Windows en el 5432). Dentro de Compose el backend usa `db:5432`.
- Rutas de la API bajo `/api/v1/`. Errores siempre como `{"detalle": str, "campos": {campo: [str]}}`.
- El admin de Django **no** se instala.
- Precios en colones como enteros (`PositiveIntegerField`). El tipo de cambio como `DecimalField(max_digits=10, decimal_places=2)`.
- Todas las FK a catálogos y a `articulo` usan `on_delete=PROTECT`, salvo las tablas hijas de un artículo (`auto`, `repuesto`, `compatibilidad`, `foto`, `auto_equipamiento`, `vista_diaria`, `historial_cambio`), que usan `CASCADE`. `venta.articulo` es `PROTECT` (un artículo con ventas no se borra).
- Cada tarea = una issue = una rama `feat/<n>-<slug>` = un PR con `Closes #<n>`. Nada directo a `main` después de la tarea 1.
- Commits con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; PRs con `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

## Review Focus

1. **El usuario Demo intenta escribir** (crear un usuario o cualquier `POST`/`PATCH`/`DELETE` del panel) → 403 «No tienes permiso…», aunque la petición se arme fuera de la interfaz. → prueba en la tarea 6.
2. **Correo con mayúsculas o espacios en el login** (`" Admin@GarajeRuta.test "`) → entra igual. → prueba traída de Sonrisa Viva en la tarea 6.
3. **Precio anterior igual o menor al precio actual** → la base lo rechaza; un precio anterior vacío está bien. → tarea 8.
4. **Reordenar fotos intercambiando órdenes 1 y 2** dentro de una transacción → funciona (restricción diferida); dejar dos fotos con orden 1 al confirmar → falla. → tarea 8.
5. **Datos de ejemplo incoherentes:** un artículo sin su fila de subtipo, un repuesto vendido o reservado con cantidad negativa, o una compatibilidad con `anio_desde > anio_hasta` → `sembrar` nunca los produce. → tarea 10.

---

### Task 1: Repo en GitHub, hoja de ruta e issues

**Files:**
- Create: `README.md`, `.gitignore`, `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`)

- [ ] **Step 1:** `README.md` mínimo: nombre, el párrafo de intención del §1 del diseño, aviso «negocio ficticio, datos de ejemplo», stack y estado «en construcción». `.gitignore` para Python (`.venv/`, `__pycache__/`, `.env`, `.pytest_cache/`, `.ruff_cache/`), Node (`node_modules/`, `.next/`, `.env.local`, `coverage/`) y `.superpowers/`. Commit en `main`.
- [ ] **Step 2:** Confirmar con Marco y crear el repo público:
  `gh repo create marcovinir/garaje-ruta --public --source . --push --description "Patio ficticio de autos usados y repuestos: catálogo con Open Graph y panel (Next.js + Django + PostgreSQL)"`.
- [ ] **Step 3:** Etiquetas `backend`, `frontend`, `diseño`, `infra`, `docs`, `requiere-plan`.
- [ ] **Step 4:** Issue **#1 «Hoja de ruta y convenciones»**: Global Constraints, enlaces al diseño y a este plan, una casilla por issue en orden, y la regla «al cerrar una issue, tachar su casilla aquí».
- [ ] **Step 5:** Una issue autosuficiente por cada tarea 2–10 (texto de la tarea, archivos, interfaces, pruebas como criterios de aceptación, «Depende de #…»).
- [ ] **Step 6:** Issues de fase: **Mockups en Claude Design** (`diseño`; pantallas del §11 del diseño, celular y escritorio) y, con `requiere-plan`, **Plan 2**, **Plan 3**, **Plan 4**, **Plan 5** y **Etapa 3**.
- [ ] **Step 7:** `gh issue list` muestra todas; actualizar la #1 con los números reales.

### Task 2: Esqueleto del backend y Docker Compose

**Files:**
- Create: `backend/{requirements.txt,requirements-dev.txt,pyproject.toml,manage.py,.env.example,conftest.py}`
- Create: `backend/config/{__init__,urls,wsgi}.py`, `backend/config/settings/{__init__,base,local,produccion,pruebas}.py`
- Create: `backend/apps/__init__.py`, `backend/apps/comun/{__init__,apps,views,urls}.py`
- Create: `backend/Dockerfile.dev`, `docker-compose.yml`, `.dockerignore`
- Test: `backend/apps/comun/tests/test_salud.py`

**Interfaces:**
- Consumes: de Sonrisa Viva, `config/settings/*.py`, `pyproject.toml` y `requirements*.txt` como punto de partida.
- Produces: `GET /api/v1/salud/` → `200 {"estado": "ok"}`, público.
- Produces: settings con `INSTALLED_APPS` = contenttypes, auth, sessions, `django.contrib.postgres`, `rest_framework`, `apps.comun` (las demás apps se agregan en sus tareas). `FRONTEND_URL` por defecto `http://localhost:3000`. `DEFAULT_FROM_EMAIL` por defecto `"Garaje Ruta <no-responder@garajeruta.test>"`. Throttle rates: `{"login": "10/min", "publico": "120/min", "vistas": "30/min"}`.
- Produces: `docker-compose.yml` con:
  - `db`: `postgres:18`, `POSTGRES_DB=garaje_ruta`, `POSTGRES_PASSWORD=postgres`, puerto `5433:5432`, volumen `pgdata`, healthcheck `pg_isready`.
  - `backend`: build `backend/Dockerfile.dev`, `DJANGO_SETTINGS_MODULE=config.settings.local`, `DATABASE_URL=postgres://postgres:postgres@db:5432/garaje_ruta`, código montado en `/app`, `depends_on: db (service_healthy)`, puerto `8000:8000`, comando `python manage.py runserver 0.0.0.0:8000`.
- Produces: `backend/.env.example` con `DATABASE_URL` (5433), `SECRET_KEY`, `CSRF_TRUSTED_ORIGINS=http://localhost:3000`, `FRONTEND_URL=http://localhost:3000`, `SEMILLA_PASSWORD=Demo-Garaje-2026`.

- [ ] **Step 1: Escribir la prueba que falla** — `test_salud_responde_ok`: `APIClient().get("/api/v1/salud/")` → 200 y `{"estado": "ok"}`.
- [ ] **Step 2:** `docker compose run --rm backend pytest -q` → FALLA (no existe la vista).
- [ ] **Step 3:** Copiar y adaptar settings, `pyproject.toml` (nombre `garaje-ruta-backend`), requirements, `manage.py`, `wsgi.py`; quitar todo lo de clínica y citas; crear la vista `salud` y su URL. `Dockerfile.dev`: `python:3.12-slim`, `pip install -r requirements-dev.txt`, `WORKDIR /app`.
- [ ] **Step 4:** `docker compose up -d db` y `docker compose run --rm backend pytest -q` → PASA. `docker compose up` y `curl http://localhost:8000/api/v1/salud/` → `{"estado":"ok"}`.
- [ ] **Step 5:** Commit en `feat/2-esqueleto-backend` y PR `Closes #2`.

### Task 3: Esqueleto del frontend (Next.js)

**Files:**
- Create: `frontend/` con `npx create-next-app@latest frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- Create: `frontend/vitest.config.mts`, `frontend/vitest.setup.ts`, `frontend/.prettierrc`, `frontend/.env.example`
- Modify: `frontend/next.config.ts`, `frontend/src/app/page.tsx`, `frontend/src/app/layout.tsx`, `frontend/package.json`
- Test: `frontend/src/app/page.test.tsx`, `frontend/src/shared/config/rewrites.test.ts`

**Interfaces:**
- Produces: `src/shared/config/rewrites.ts` → `reescriturasApi(backendUrl: string): { source: string; destination: string }[]`, que devuelve `[{ source: "/api/v1/:ruta*", destination: "<backendUrl sin barra final>/api/v1/:ruta*" }]`. `next.config.ts` la usa con `process.env.BACKEND_URL ?? "http://localhost:8000"`. (`/api/revalidar` del Plan 2 queda fuera porque no empieza con `/api/v1/`.)
- Produces: scripts `dev`, `build`, `start`, `lint`, `format`, `format:check`, `test` (`vitest run`).
- Produces: `layout.tsx` con `lang="es"` y título `Garaje Ruta`.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `reescriturasApi("http://api.test/")` → `[{ source: "/api/v1/:ruta*", destination: "http://api.test/api/v1/:ruta*" }]`.
  - `page.test.tsx`: renderiza la página y encuentra el encabezado `Garaje Ruta` y el texto «en construcción».
- [ ] **Step 2:** `npm test` → FALLA.
- [ ] **Step 3:** Implementar `reescriturasApi`, conectarla en `next.config.ts` (`async rewrites()`), y una página de inicio provisional.
- [ ] **Step 4:** `npm test`, `npm run lint`, `npm run format:check` y `npm run build` → PASAN. Con el backend arriba, `npm run dev` y abrir `http://localhost:3000/api/v1/salud/` → `{"estado":"ok"}` (prueba el rewrite).
- [ ] **Step 5:** Commit en `feat/3-esqueleto-frontend` y PR `Closes #3`.

### Task 4: CI y protección de `main`

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: jobs `backend` y `frontend`, copiados de `sonrisa-viva/.github/workflows/ci.yml` sin el job `e2e` (llega en el Plan 5):
  - `backend`: servicio `postgres:18` (`POSTGRES_DB=garaje_ruta`, puerto `5432:5432`), Python 3.12, `ruff check .`, `ruff format --check .`, `makemigrations --check --dry-run`, `pytest -q`, y `check --deploy --fail-level WARNING` con settings de producción (`ALLOWED_HOSTS=garaje-ruta-api.vercel.app`, `CSRF_TRUSTED_ORIGINS` y `FRONTEND_URL` = `https://garajeruta.marcovinir.dev`).
  - `frontend`: Node 24, `npm ci`, `lint`, `format:check`, `test`, `build`.

- [ ] **Step 1:** Escribir el workflow y abrir el PR. Los dos jobs pasan en verde.
- [ ] **Step 2:** Proteger `main` con `gh api -X PUT repos/marcovinir/garaje-ruta/branches/main/protection`: checks requeridos `backend` y `frontend`, PR obligatorio, `enforce_admins: true`, sin revisiones obligatorias (Marco trabaja solo).
- [ ] **Step 3:** Fusionar el PR `Closes #4` y comprobar con `gh api repos/marcovinir/garaje-ruta/branches/main/protection` que quedó activa.

### Task 5: Piezas comunes y modelo de cuentas

**Files:**
- Create (copiados de Sonrisa Viva y adaptados): `backend/apps/comun/{errores,paginacion,permisos,notificaciones,correos,pruebas}.py`, `backend/apps/comun/templates/`
- Create: `backend/apps/cuentas/{__init__,apps,models,managers,permisos}.py`, `backend/apps/cuentas/migrations/0001_initial.py` (generada) y `0002_roles_y_permisos.py` (datos)
- Modify: `backend/config/settings/base.py` (`AUTH_USER_MODEL = "cuentas.Usuario"`, app `apps.cuentas`, `EXCEPTION_HANDLER`, paginación, `NOTIFICADOR`)
- Test (traídas y adaptadas): `backend/apps/comun/tests/{test_errores,test_notificaciones,test_permisos}.py`, `backend/apps/cuentas/tests/test_modelos.py`

**Interfaces:**
- Consumes: de Sonrisa Viva, `manejador_excepciones`, `Conflicto`, `PaginacionEstandar`, `tiene_permiso(codigo)`, `tiene_alguno(*codigos)`, `Notificador`/`NotificadorCorreo`/`NotificadorMemoria`/`obtener_notificador()`/`enviar_sin_fallar(...)`, `html_correo(...)`, `cliente_de(usuario)`, `crear_admin(email)`, y `Usuario`/`UsuarioManager`/`normalizar_email` tal cual.
- Produces: `apps/cuentas/permisos.py`:
  - Roles `ROL_ADMIN = "admin"`, `ROL_COLABORADOR = "colaborador"`, `ROL_DEMO = "demo"`.
  - Permisos `ARTICULOS_VER = "articulos.ver"`, `ARTICULOS_CREAR = "articulos.crear"`, `ARTICULOS_EDITAR = "articulos.editar"`, `ARTICULOS_CAMBIAR_ESTADO = "articulos.cambiar_estado"`, `ARTICULOS_ELIMINAR = "articulos.eliminar"`, `VENTAS_REGISTRAR = "ventas.registrar"`, `CATALOGOS_AGREGAR = "catalogos.agregar"`, `CATALOGOS_GESTIONAR = "catalogos.gestionar"`, `USUARIOS_GESTIONAR = "usuarios.gestionar"`, `CONFIGURACION_EDITAR = "configuracion.editar"`, `REPORTES_VER = "reportes.ver"`, `HISTORIAL_VER = "historial.ver"`, cada uno con su descripción en `DESCRIPCIONES_PERMISO`.
  - `PERMISOS_POR_ROL`: admin = todos; colaborador = `{ARTICULOS_VER, ARTICULOS_CREAR, ARTICULOS_EDITAR, ARTICULOS_CAMBIAR_ESTADO, VENTAS_REGISTRAR, CATALOGOS_AGREGAR, REPORTES_VER, HISTORIAL_VER}`; demo = `{ARTICULOS_VER, REPORTES_VER, HISTORIAL_VER}`.
- Produces: `UsuarioManager.create_user` usa `"colaborador"` como rol por defecto (en Sonrisa Viva era `"dentista"`).

- [ ] **Step 1: Escribir las pruebas que fallan** (además de las traídas):

```python
def test_roles_sembrados_con_sus_permisos(db):
    assert set(Rol.objects.values_list("nombre", flat=True)) == {"admin", "colaborador", "demo"}
    for nombre, codigos in PERMISOS_POR_ROL.items():
        rol = Rol.objects.get(nombre=nombre)
        assert {rp.permiso.codigo for rp in rol.rolpermiso_set.all()} == codigos

def test_colaborador_no_borra_ni_gestiona_usuarios(db):
    c = Usuario.objects.crear_usuario("c@x.test", "C", "X", "colaborador")
    assert c.tiene_permiso("articulos.editar")
    assert not c.tiene_permiso("articulos.eliminar") and not c.tiene_permiso("usuarios.gestionar")

def test_demo_solo_lee(db):
    d = Usuario.objects.crear_usuario("d@x.test", "D", "X", "demo")
    assert d.codigos_permiso() == {"articulos.ver", "reportes.ver", "historial.ver"}
```

- [ ] **Step 2:** `docker compose run --rm backend pytest -q` → FALLA.
- [ ] **Step 3:** Copiar las piezas, cambiar roles y permisos, generar `0001` con `makemigrations`, copiar `0002` (siembra desde `PERMISOS_POR_ROL`). Adaptar las pruebas traídas (rol `colaborador` donde decían `dentista`).
- [ ] **Step 4:** `docker compose down -v && docker compose up -d db` (primera migración con `AUTH_USER_MODEL`), luego `migrate` y `pytest -q` → PASA.
- [ ] **Step 5:** Commit en `feat/5-cuentas` y PR `Closes #5`.

### Task 6: Sesión, activación, recuperación y usuarios del panel

**Files:**
- Create (copiados y adaptados): `backend/apps/cuentas/{correos,selectors,serializers,services,urls,urls_panel,views,views_panel}.py`, `backend/apps/cuentas/templates/`
- Modify: `backend/config/urls.py` (`api/v1/auth/` y `api/v1/panel/`)
- Test (traídas y adaptadas): `backend/apps/cuentas/tests/{test_sesion,test_activacion,test_correos,test_usuarios_panel}.py`

**Interfaces:**
- Produces: los endpoints de Sonrisa Viva con el mismo contrato: `GET auth/csrf/`, `POST auth/login/` (throttle `login`), `POST auth/logout/`, `GET auth/yo/` (usuario, rol y `permisos`), `POST auth/activar/`, `POST auth/recuperar/`, `POST auth/restablecer/`, y el CRUD `panel/usuarios/` protegido con `tiene_permiso(USUARIOS_GESTIONAR)`.
- Produces: correos con la marca «Garaje Ruta» (asunto, firma y colores neutros; el diseño visual final llega con los mockups). Los enlaces usan `FRONTEND_URL` + `/panel/activar/...` y `/panel/restablecer/...` (el Plan 4 los traduce a `PANEL_RUTA`).

- [ ] **Step 1: Escribir las pruebas que fallan** (además de las traídas):
  - `test_demo_no_puede_crear_usuarios`: con `cliente_de(demo)`, `POST /api/v1/panel/usuarios/` → 403 y `detalle` empieza con «No tienes permiso».
  - `test_colaborador_no_puede_listar_usuarios`: `GET /api/v1/panel/usuarios/` → 403.
  - `test_yo_devuelve_permisos_del_colaborador`: `GET /api/v1/auth/yo/` incluye `"articulos.crear"` y no `"usuarios.gestionar"`.
- [ ] **Step 2:** `pytest apps/cuentas -q` → FALLA.
- [ ] **Step 3:** Copiar y adaptar las vistas, servicios, selectores, serializers, URLs y plantillas.
- [ ] **Step 4:** `pytest -q` → PASA.
- [ ] **Step 5:** Commit en `feat/6-sesion-y-usuarios` y PR `Closes #6`.

### Task 7: Catálogos

**Files:**
- Create: `backend/apps/catalogos/{__init__,apps,models}.py`, `migrations/0001_initial.py` (generada) y `0002_catalogos_iniciales.py` (datos)
- Create: `backend/apps/catalogos/semillas.py` (constantes de la migración de datos)
- Modify: `backend/config/settings/base.py` (app `apps.catalogos`)
- Test: `backend/apps/catalogos/tests/test_modelos.py`

**Interfaces:**
- Produces: modelos (tabla = nombre en singular `snake_case`):
  - `Marca(nombre unique, slug unique)`, `Modelo(marca FK PROTECT related_name="modelos", nombre, slug)` con `UniqueConstraint(marca, nombre, name="modelo_nombre_unico")` y `UniqueConstraint(marca, slug, name="modelo_slug_unico")`.
  - `Transmision(nombre unique)`, `Combustible(nombre unique)`, `Traccion(nombre unique)`, `Carroceria(nombre unique, slug unique, orden)`.
  - `CategoriaPieza(padre FK self null PROTECT related_name="hijas", nombre, slug unique)`.
  - `GrupoEquipamiento(nombre unique, orden)`, `Equipamiento(grupo FK PROTECT related_name="equipamientos", nombre unique, orden, filtrable bool default False)`.
  - Todos con `__str__` = `nombre` (el `Modelo`: «Toyota Corolla»).
- Produces: `0002` siembra (desde `semillas.py`):
  - Transmisiones: Manual, Automática, Automática/Dual, CVT. Combustibles: Gasolina, Diésel, Híbrido, Híbrido enchufable, Eléctrico, Gas LP. Tracciones: 4x2, 4x4, AWD. Carrocerías (en orden): Sedán, Hatchback, SUV, Crossover, Pickup, Microbús, Comercial, Coupé.
  - Los 5 grupos y el equipamiento exacto del §6 del diseño, con `filtrable=True` en los marcados con ★.
  - Las categorías de pieza raíz: Motor, Transmisión, Suspensión y dirección, Frenos, Sistema eléctrico, Enfriamiento, Carrocería, Iluminación, Interior, Llantas y aros (las hijas las crea `sembrar` o el admin).
  - Marcas y modelos **no** van aquí: los crea `sembrar` (tarea 10) o el panel.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_catalogos_iniciales`: hay 4 transmisiones, 3 tracciones, 8 carrocerías, 5 grupos; `Equipamiento.objects.get(nombre="Aire acondicionado").filtrable is True` y su grupo es «Confort»; `Equipamiento.objects.filter(filtrable=True).count() == 9` (los ★ del diseño).
  - `test_modelo_unico_por_marca`: dos `Modelo("Corolla")` en Toyota → `IntegrityError`; «Corolla» en otra marca → bien.
  - `test_categoria_hija`: `CategoriaPieza(nombre="Alternador", padre=sistema_electrico)` aparece en `sistema_electrico.hijas`.
- [ ] **Step 2:** `pytest apps/catalogos -q` → FALLA.
- [ ] **Step 3:** Modelos, `makemigrations`, migración de datos con `apps.get_model`.
- [ ] **Step 4:** `pytest -q` → PASA.
- [ ] **Step 5:** Commit en `feat/7-catalogos` y PR `Closes #7`.

### Task 8: Artículos, autos, repuestos, compatibilidad y fotos

**Files:**
- Create: `backend/apps/articulos/{__init__,apps,models}.py`, `migrations/0002_initial.py` (generada)
- Create: `backend/apps/articulos/migrations/0001_extensiones.py` (a mano, antes de la inicial, que pasa a ser `0002`): `UnaccentExtension()` y `TrigramExtension()` de `django.contrib.postgres.operations` (las usa la búsqueda del Plan 2; Supabase las soporta)
- Modify: `backend/config/settings/base.py` (app `apps.articulos`)
- Test: `backend/apps/articulos/tests/test_modelos.py`, `backend/apps/articulos/tests/conftest.py` (fábricas)

**Interfaces:**
- Consumes: los modelos de la tarea 7 y `Usuario`.
- Produces: en `apps/articulos/models.py`, con `TextChoices`:
  - `TipoArticulo`: `AUTO="auto"`, `REPUESTO="repuesto"`. `EstadoArticulo`: `DISPONIBLE`, `RESERVADO`, `VENDIDO`, `OCULTO` (valores en minúscula). `CondicionRepuesto`: `NUEVO`, `USADO`. `Procedencia`: `AGENCIA`, `IMPORTADO`. `EstadoGeneral`: `EXCELENTE`, `MUY_BUENO="muy_bueno"`, `BUENO`, `REGULAR`.
  - `Articulo(tipo, titulo max 150, descripcion blank, precio_colones, precio_anterior_colones null, estado default DISPONIBLE, destacado default False, publicado_en default now, creado_por FK PROTECT, creado_en auto_now_add, actualizado_en auto_now)`. Índices: `(tipo, estado)` y `(-publicado_en)`.
    - Checks: `articulo_precio_anterior_mayor` → `Q(precio_anterior_colones__isnull=True) | Q(precio_anterior_colones__gt=F("precio_colones"))`.
  - `Auto(articulo OneToOne PK CASCADE related_name="auto", modelo, anio, version blank, kilometraje, transmision, combustible, traccion, carroceria, color_exterior, color_interior blank, cilindrada_cc null, puertas, pasajeros, bolsas_aire default 0, unico_dueno, procedencia, marchamo_al_dia, riteve_vence null, impuestos_pagados default True, acepta_vehiculo, precio_negociable, estado_general, placa_termina_en null, equipamiento M2M Equipamiento through AutoEquipamiento)`.
    - Checks: `auto_anio_minimo` (`anio >= 1950`; el máximo, año actual + 1, lo valida el serializer del Plan 2 porque cambia con el tiempo), `auto_puertas_positivas`, `auto_pasajeros_positivos`, `auto_placa_digito` (`placa_termina_en` nulo o entre 0 y 9). `kilometraje` es `PositiveIntegerField`.
  - `AutoEquipamiento(auto CASCADE, equipamiento PROTECT)` con `UniqueConstraint(auto, equipamiento, name="auto_equipamiento_unico")`.
  - `Repuesto(articulo OneToOne PK CASCADE related_name="repuesto", categoria_pieza PROTECT, condicion, cantidad PositiveIntegerField default 1, codigo_interno null unique, numero_parte blank)`.
  - `Compatibilidad(repuesto FK CASCADE related_name="compatibilidades", modelo PROTECT, anio_desde, anio_hasta)` con check `compatibilidad_rango_anios` (`anio_desde <= anio_hasta`) e índice `(modelo, anio_desde, anio_hasta)`.
  - `Foto(articulo FK CASCADE related_name="fotos", public_id max 255, ancho, alto, orden PositiveSmallIntegerField)` con `UniqueConstraint(articulo, orden, name="foto_orden_unico", deferrable=Deferrable.DEFERRED)`, check `foto_orden_positivo` (`orden >= 1`) y `ordering = ["orden"]`.
  - Propiedades: `Articulo.foto_principal -> Foto | None` (la de `orden=1`) y `Articulo.agotado -> bool` (`tipo == REPUESTO and repuesto.cantidad == 0`).

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_precio_anterior_debe_ser_mayor`: con `precio_anterior_colones` igual al precio → `IntegrityError`; menor → `IntegrityError`; `None` → se guarda.
  - `test_cantidad_no_negativa`: `Repuesto.objects.filter(pk=r.pk).update(cantidad=F("cantidad") - 5)` con cantidad 1 → `IntegrityError` (o `DataError`).
  - `test_compatibilidad_rango`: `anio_desde=2016, anio_hasta=2012` → `IntegrityError`.
  - `test_placa_un_digito`: `placa_termina_en=10` → `IntegrityError`.
  - `test_foto_principal_es_orden_1` y `test_agotado_solo_repuestos_en_cero`.
  - `test_intercambiar_orden_de_fotos_en_transaccion` (Review Focus 4): fotos 1 y 2; dentro de `transaction.atomic()` poner la 1 en 2 y la 2 en 1 → al salir, se respeta el intercambio. `test_dos_fotos_orden_1_falla_al_confirmar` → `IntegrityError`.
- [ ] **Step 2:** `pytest apps/articulos -q` → FALLA.
- [ ] **Step 3:** Migración de extensiones a mano, luego modelos y `makemigrations` (la inicial depende de la de extensiones).
- [ ] **Step 4:** `pytest -q` → PASA, y `docker compose exec db psql -U postgres garaje_ruta -c '\dx'` lista `unaccent` y `pg_trgm`.
- [ ] **Step 5:** Commit en `feat/8-articulos` y PR `Closes #8`.

### Task 9: Actividad y configuración del negocio

**Files:**
- Create: `backend/apps/actividad/{__init__,apps,models}.py` + `migrations/0001_initial.py`
- Create: `backend/apps/negocio/{__init__,apps,models}.py` + `migrations/0001_initial.py` y `0002_configuracion_inicial.py`
- Modify: `backend/config/settings/base.py`
- Test: `backend/apps/actividad/tests/test_modelos.py`, `backend/apps/negocio/tests/test_modelos.py`

**Interfaces:**
- Produces: `apps/actividad/models.py`:
  - `Venta(articulo FK PROTECT related_name="ventas", cantidad PositiveIntegerField, precio_unitario_colones, registrada_por FK PROTECT, fecha default now)` con check `venta_cantidad_positiva` (`cantidad > 0`) e índice `(fecha)`.
  - `VistaDiaria(articulo FK CASCADE, fecha DateField, cantidad PositiveIntegerField default 0)` con `UniqueConstraint(articulo, fecha, name="vista_diaria_unica")`.
  - `AccionHistorial` (`TextChoices`): `CREAR`, `EDITAR`, `CAMBIAR_ESTADO="cambiar_estado"`, `VENDER`, `DESHACER_VENTA="deshacer_venta"`, `FOTOS`. `HistorialCambio(articulo FK CASCADE related_name="historial", usuario FK PROTECT, accion, detalle JSONField default dict, fecha default now)` con `ordering = ["-fecha"]`.
  - `TipoCambio(fecha DateField unique, compra, venta, fuente max 40, obtenido_en auto_now_add)` con check `tipo_cambio_positivo` (`compra > 0` y `venta > 0`) y `ordering = ["-fecha"]`; `TipoCambio.vigente() -> TipoCambio | None` (el de fecha más reciente).
- Produces: `apps/negocio/models.py`:
  - `ConfiguracionNegocio(nombre, logo_public_id blank, whatsapp, direccion, mapa_url blank)` con check `configuracion_unica` (`id = 1`) y `ConfiguracionNegocio.obtener() -> ConfiguracionNegocio` (devuelve la fila 1).
  - `HorarioAtencion(configuracion FK CASCADE related_name="horarios", dia_semana 0–6, apertura, cierre)` con checks `horario_dia_valido` y `horario_apertura_antes_cierre`, `ordering = ["dia_semana", "apertura"]`.
  - `0002` crea la fila 1: nombre «Garaje Ruta», whatsapp `50600000000` (ficticio, se cambia desde el panel), dirección ficticia «Heredia, Costa Rica», y horario lunes–viernes 08:00–17:00 y sábado 08:00–12:00.

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_venta_cantidad_positiva` (cantidad 0 → `IntegrityError`).
  - `test_vista_diaria_unica_por_dia`.
  - `test_tipo_cambio_vigente_es_el_mas_reciente` y `test_tipo_cambio_vigente_none_sin_datos`.
  - `test_solo_una_configuracion`: crear con `id=2` → `IntegrityError`; `ConfiguracionNegocio.obtener().nombre == "Garaje Ruta"` y tiene 6 horarios.
  - `test_articulo_con_ventas_no_se_borra`: `articulo.delete()` con una venta → `ProtectedError`.
- [ ] **Step 2:** `pytest -q` → FALLA.
- [ ] **Step 3:** Modelos y migraciones.
- [ ] **Step 4:** `pytest -q` → PASA.
- [ ] **Step 5:** Commit en `feat/9-actividad-y-negocio` y PR `Closes #9`.

### Task 10: Datos de ejemplo (`sembrar`)

**Files:**
- Create: `backend/apps/comun/management/commands/sembrar.py`, `backend/apps/comun/semillas.py` (datos como constantes)
- Test: `backend/apps/comun/tests/test_sembrar.py`

**Interfaces:**
- Consumes: todos los modelos de las tareas 5–9 y `UsuarioManager.crear_usuario`.
- Produces: `python manage.py sembrar [--reiniciar]`, con `random.Random(42)`, dentro de `transaction.atomic()`:
  - Idempotente: si ya hay artículos y no se pasa `--reiniciar`, avisa y no hace nada. Con `--reiniciar` borra (en este orden) historial, vistas, ventas, artículos, marcas y modelos, categorías de pieza hijas, tipos de cambio y usuarios que no sean `admin@garajeruta.test`; los catálogos de las migraciones se conservan.
  - Usuarios activos con la contraseña `SEMILLA_PASSWORD` (por defecto `Demo-Garaje-2026`): `admin@garajeruta.test` (admin), `colaborador@garajeruta.test` y `demo@garajeruta.test`.
  - ~12 marcas comunes en Costa Rica (Toyota, Hyundai, Nissan, Kia, Suzuki, Mitsubishi, Honda, Mazda, Chevrolet, Ford, Isuzu, BYD) con 3–5 modelos cada una.
  - Hijas de categorías de pieza (p. ej. Alternador y Batería en Sistema eléctrico; Pastillas y Discos en Frenos; Faros y Stops en Iluminación).
  - **40 autos** (≈ 34 disponibles, 2 reservados, 4 vendidos) con todos sus campos coherentes (los eléctricos sin cilindrada), 6–18 equipamientos al azar ponderados por año, ~20 % con precio anterior, 6 destacados, y de 4 a 8 fotos cada uno.
  - **80 repuestos** (≈ 70 con cantidad 1–6, 10 agotados) con 1–3 compatibilidades cada uno y de 2 a 4 fotos.
  - Las fotos usan `public_id` de la lista `FOTOS_EJEMPLO` en `semillas.py` (`garaje-ruta/ejemplo/<tipo>-<nn>`); el Plan 2 sube esas imágenes a Cloudinary con un comando aparte.
  - **Ventas de los últimos 180 días:** una por cada auto vendido y ~120 de repuestos (los agotados quedan en 0 por ventas reales, no por dato suelto), con `precio_unitario_colones` = precio del artículo.
  - **Vistas diarias** de los últimos 60 días, más altas en los destacados.
  - **Historial:** una entrada `crear` por artículo y una `vender` por venta.
  - **Tipo de cambio** de los últimos 60 días (venta alrededor de ₡505–515, compra ₡6 menos), fuente `"ejemplo"`.
  - Imprime un resumen (`Creados: 40 autos, 80 repuestos, …`).

- [ ] **Step 1: Escribir las pruebas que fallan**
  - `test_sembrar_crea_datos`: 40 artículos `auto` y 80 `repuesto`; 3 usuarios; `admin@garajeruta.test` se autentica con la contraseña de ejemplo.
  - `test_sembrar_datos_coherentes` (Review Focus 5): cada `Articulo` auto tiene `auto` y ningún `repuesto` (y al revés); ningún `Compatibilidad` con `anio_desde > anio_hasta`; todo auto vendido tiene exactamente una venta; la cantidad de cada repuesto + sus unidades vendidas es ≥ 1; todo artículo tiene una foto con `orden=1`.
  - `test_sembrar_dos_veces_no_duplica`.
  - `test_sembrar_reiniciar_regenera`: tras `--reiniciar`, los conteos son los mismos y el admin se conserva.
- [ ] **Step 2:** `pytest apps/comun/tests/test_sembrar.py -q` → FALLA.
- [ ] **Step 3:** Implementar el comando.
- [ ] **Step 4:** `pytest -q` → PASA, y `docker compose run --rm backend python manage.py sembrar` imprime el resumen contra la base de desarrollo.
- [ ] **Step 5:** Commit en `feat/10-sembrar` y PR `Closes #10`. Al fusionar, tachar las casillas del Plan 1 en la #1 y actualizar el README con «Cómo correrlo» (`docker compose up`, `sembrar`, `npm run dev`).
