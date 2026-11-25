# Plan 5 — Despliegue, E2E, Lighthouse CI, respaldo y README de portafolio: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** publicar Garaje Ruta en `https://garajeruta.marcovinir.dev` con datos y fotos de ejemplo, correo real, pruebas E2E en celular y escritorio, Lighthouse CI, un respaldo con restauración probada y un README de portafolio.

**Architecture:** la del diseño §5, igual que Sonrisa Viva (ya desplegada; sus lecciones están en `Proyectos/sonrisa-viva`, PRs #98–#104):
- **Dos proyectos en Vercel:**
  - `garaje-ruta`: raíz `frontend/`, Next.js nativo; el rewrite `/api/v1/*` ya está en `next.config.ts`.
  - `garaje-ruta-api`: raíz `backend/`, con el **soporte nativo de Django** de Vercel. Las dependencias salen de `pyproject.toml`; no hay `vercel.json` ni `api/index.py`.
- **Supabase Postgres:**
  - la app va por el pooler en modo transacción (6543);
  - las migraciones, el resembrado y el respaldo, por el pooler en modo sesión (5432) desde GitHub Actions.
- **Fotos:** Cloudinary.
- **Correo:** SMTP de Resend, ya configurado en `produccion.py`.
- **Frescura:** Django avisa a Next en `POST /api/revalidar` (Plan 3). Next llama a Django servidor a servidor con `X-Servidor-Next`.

**Tech Stack:** lo de los planes 1–4, más `@playwright/test`, `@lhci/cli` y GitHub Actions (`migrar.yml`, `resembrar.yml`, `respaldo.yml`, job `e2e`).

**Spec:** `docs/superpowers/specs/2026-11-23-garaje-ruta-design.md` (§3 hospedaje, §5 arquitectura, §8 fotos, §9 `PANEL_RUTA`, §12 calidad y respaldo, §13 fase 8). Los pendientes están en la #15 (cuerpo y comentario), la #34 (fotos de ejemplo) y la nota del Plan 3 sobre el `stale-time` del enrutador del cliente.

## Global Constraints

- **Valores fijados:**
  - Dominio `garajeruta.marcovinir.dev`, que apunta al proyecto frontend. El DNS de `marcovinir.dev` está en name.com.
  - Supabase por el pooler.
  - Región de Supabase `us-east-1`, igual que Vercel por defecto.
  - Python 3.12 y Node 24.
  - El admin de Django no existe.
  - Los datos de ejemplo se reinician **lunes y jueves**; eso también evita que Supabase gratis se pause tras ~7 días.
- **Variables del backend (Vercel):**
  - `DJANGO_SETTINGS_MODULE=config.settings.produccion`, `SECRET_KEY`;
  - `DATABASE_URL` (pooler 6543), `ALLOWED_HOSTS` (el host `*.vercel.app` del backend);
  - `CSRF_TRUSTED_ORIGINS=https://garajeruta.marcovinir.dev`, `FRONTEND_URL=https://garajeruta.marcovinir.dev`;
  - `PANEL_RUTA`, `REVALIDACION_SECRETO`, `SERVIDOR_NEXT_SECRETO`;
  - `CLOUDINARY_URL`;
  - `EMAIL_HOST_PASSWORD` (API key de Resend), `DEFAULT_FROM_EMAIL`;
  - `NUM_PROXIES` (tarea 1).
- **Variables del frontend (Vercel):**
  - `BACKEND_URL` (`https://<backend>.vercel.app`), `SITIO_URL=https://garajeruta.marcovinir.dev`;
  - `SERVIDOR_NEXT_SECRETO` y `REVALIDACION_SECRETO`, iguales a los del backend;
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD` (el nombre de la nube, no es secreto);
  - `NEXT_PUBLIC_PANEL_RUTA`, igual a `PANEL_RUTA`. Se inyecta **al compilar**: cambiarla exige volver a desplegar.
- **La ruta del panel en producción la elige Marco.** Como el panel se muestra con el usuario demo, la ruta se publica en el README junto a ese usuario (§9).
- **Cuentas y secretos:** todo lo que crea cuentas o escribe secretos lo hace **Marco**: Supabase, Cloudinary, Resend, Vercel, DNS y los *secrets* de GitHub. El ejecutor nunca ve, pide ni escribe contraseñas, claves ni URLs con credenciales. Los pasos marcados **(Marco)** se piden y se esperan. Un comando que necesita un secreto (p. ej. `subir_fotos_ejemplo` con `CLOUDINARY_URL` en `backend/.env`) lo puede lanzar el ejecutor solo si el secreto ya está donde el comando lo lee, sin mostrarlo.
- **Lo que no cambia:** las suites existentes siguen en verde (286 backend, 198 frontend) y CI sigue siendo la puerta de `main`. Una issue = una rama = un PR.
- **Medir en producción, no en dev:** códigos HTTP, revalidación y Lighthouse se miden contra el despliegue o contra `next start` (lección del Plan 3).

## Review Focus

1. **Login detrás del rewrite:** Django compara el `Origin` (el dominio del frontend) con su host. Si `CSRF_TRUSTED_ORIGINS` está mal o la cookie no es `Secure`, el login da 403. → La tarea 3 lo verifica en vivo, con los tres usuarios.
2. **Revalidación en producción (HU-04):** si `FRONTEND_URL` del backend no es el dominio real o `REVALIDACION_SECRETO` difiere entre proyectos, la web sigue mostrando un auto vendido hasta su `revalidate` de respaldo. → Tarea 3: vender desde el panel y comprobar que sale del inicio, de `/autos` y del sitemap en < 1 min; deshacer y que vuelva. Tarea 4: el mismo flujo en E2E.
3. **Next → Django servidor a servidor:** sin `SERVIDOR_NEXT_SECRETO`, todas las páginas públicas comparten el límite de 120/min de la IP de Vercel y fallan con tráfico. → Tarea 3: `curl` directo al backend con y sin el encabezado; 130 peticiones seguidas con el encabezado no dan 429.
4. **Límite de intentos del login con `X-Forwarded-For` falsificado:** si DRF cuenta mal los saltos de proxy, se puede evadir el 429 cambiando el encabezado. → Tarea 1 fija `NUM_PROXIES` y la tarea 3 lo comprueba en vivo: 11 intentos fallidos con un `X-Forwarded-For` distinto en cada uno → el 11.º da 429.
5. **Fotos reales:** la firma con la nube real, la subida desde un celular de verdad, cada foto servida < 300 KB (HU-01) y `og:image` de 1200×630 que WhatsApp y Facebook muestran (HU-02). → Tarea 3 (subida y peso) y tarea 7 (vista previa en el depurador de Facebook y en un chat de WhatsApp).

---

### Task 1: Pendientes del backend y del frontend antes de desplegar

**Files:**
- Modify: `backend/config/settings/{base,produccion}.py`, `backend/apps/comun/errores.py`, `backend/apps/cuentas/services.py` (`enviar_enlace_recuperacion`, creación y reenvío de invitación), `frontend/next.config.ts`
- Test: `backend/apps/comun/tests/test_produccion.py`, `backend/apps/cuentas/tests/test_correos.py`, `backend/apps/comun/tests/test_throttle.py`

**Interfaces:**
- **Correo:**
  - `produccion.py` exige `EMAIL_HOST_PASSWORD` y `DEFAULT_FROM_EMAIL` con `os.environ[...]`;
  - un `smtplib.SMTPException` u `OSError` del envío al crear un usuario o reenviar la invitación responde **503** `{"detalle": "No pudimos enviar el correo. Probá de nuevo en unos minutos."}` (en el manejador de errores, no HTML);
  - `enviar_enlace_recuperacion` usa `enviar_sin_fallar`: «recuperar» responde siempre 204 y nunca revela si el correo existe.
- **`NUM_PROXIES`:** `REST_FRAMEWORK["NUM_PROXIES"] = int(os.environ.get("NUM_PROXIES", "1"))` en producción, así el cliente es la IP que agrega el último salto de Vercel. La tarea 3 confirma el valor real.
- **`ALMACEN_FOTOS`:** se lee de `os.environ.get("ALMACEN_FOTOS", "apps.articulos.fotos.AlmacenCloudinary")`. Así el job E2E de la tarea 4 usa `AlmacenFotosMemoria` sin Cloudinary.
- **Enrutador del cliente (Next):** leer `frontend/node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/staleTimes.md`. Si la opción sigue siendo la que fija cuánto reutiliza el navegador las páginas dinámicas, poner `experimental.staleTimes.dynamic = 0`, para que alguien que ya navega no vea un auto vendido. Si no aplica a Cache Components, dejar una decisión en el ledger.

- [ ] **Step 1: Pruebas que fallan**
  - `test_produccion_exige_clave_de_correo`: sin `EMAIL_HOST_PASSWORD`, el arranque falla nombrándola;
  - `test_produccion_lee_num_proxies`: con `NUM_PROXIES=2` queda en 2, y sin la variable en 1;
  - `test_smtp_caido_al_crear_usuario_da_503`: con un notificador que lanza `smtplib.SMTPException`, `POST /panel/usuarios/` → 503 JSON con `detalle`;
  - `test_recuperar_con_smtp_caido_responde_204_igual`;
  - `test_throttle_login_con_x_forwarded_for_distinto`: con `NUM_PROXIES=1`, 11 intentos con `REMOTE_ADDR` fijo y `X-Forwarded-For` falso distinto (`"9.9.9.N, 1.2.3.4"`) → el 11.º da 429.
- [ ] **Step 2:** `docker compose run --rm backend pytest -q` → FALLAN las nuevas.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Todo pasa: `pytest`, `ruff`, `npm test`, `lint` y `build`. Commit, PR.

### Task 2: Workflows de migración, resembrado y respaldo

**Files:**
- Create: `.github/workflows/{migrar,resembrar,respaldo}.yml`, `docs/respaldo.md`

**Interfaces** (copiar la forma de `sonrisa-viva/.github/workflows/{migrar,resembrar}.yml`):
- **`migrar.yml`:**
  - se lanza con `workflow_dispatch` y la entrada `sembrar: boolean`;
  - `concurrency: base-de-produccion`;
  - corre `migrate --noinput`, `createcachetable` y, si se pide, `sembrar --reiniciar`;
  - *secrets:* `DATABASE_URL_MIGRACIONES` (pooler 5432), `SEMILLA_PASSWORD`, `SEMILLA_PASSWORD_DEMO`;
  - las obligatorias que no tocan la base van con valores de ejemplo, como en `tipo-cambio.yml` (`PANEL_RUTA: /panel`, etc.).
- **`resembrar.yml`:**
  - `schedule: cron "0 9 * * 1,4"` (lunes y jueves a las 3:00 de Costa Rica) más `workflow_dispatch`;
  - la misma `concurrency`;
  - `sembrar --reiniciar` y luego `actualizar_tipo_cambio`.
- **`respaldo.yml`:**
  - `schedule: cron "0 10 * * 0"` (domingo) más `workflow_dispatch`;
  - instala el cliente `postgresql-client` de la **misma versión mayor** que Supabase (PGDG);
  - corre `pg_dump --format=custom --no-owner --no-privileges` sobre `DATABASE_URL_MIGRACIONES` (sin imprimirla);
  - sube `respaldo-AAAA-MM-DD.dump` como artefacto con `retention-days: 30`.
- **`docs/respaldo.md`:**
  - cómo descargar el artefacto (`gh run download`);
  - cómo restaurarlo en el Postgres de Docker en una base aparte (`createdb garaje_ruta_restaurada` + `pg_restore --no-owner`);
  - con qué consultas comprobar que quedó bien (conteo de `articulo`, `venta`, `usuario`).
  - Más el respaldo diario propio de Supabase.

- [ ] **Step 1:** Escribir los tres workflows y el documento.
- [ ] **Step 2:** `actionlint`, o `gh workflow view` tras fusionar, sin errores de sintaxis. La primera corrida real va en la tarea 3.
- [ ] **Step 3:** PR.

### Task 3: Puesta en marcha (Marco + ejecutor)

Sin código nuevo, salvo lo que la verificación en vivo demuestre que falta (con su prueba).

- [ ] **Step 1 (Marco):** crear el proyecto de Supabase y guardar las dos URL del pooler (6543 y 5432) donde las vaya a necesitar: Vercel y el *secret* de GitHub.
- [ ] **Step 2 (Marco):** cuenta de Cloudinary; poner `CLOUDINARY_URL` en `backend/.env`.
  - **Ejecutor:** `docker compose run --rm backend python manage.py subir_fotos_ejemplo --carpeta semillas/fotos`. Expected: «40 fotos subidas» (o las que ya estaban). Cierra la #34.
- [ ] **Step 3 (Marco):** Resend: verificar `marcovinir.dev` (los registros DNS van en name.com), elegir el remitente (p. ej. `Garaje Ruta <garaje@marcovinir.dev>`) y crear la API key.
- [ ] **Step 4 (Marco):** *secrets* de GitHub: `DATABASE_URL_MIGRACIONES`, `SEMILLA_PASSWORD` (secreta) y `SEMILLA_PASSWORD_DEMO` (la pública del README).
  - **Ejecutor:** lanzar `migrar.yml` con `sembrar: true` y después `respaldo.yml`. Expected: los dos en verde; el log de `sembrar` muestra el resumen de autos y repuestos; el artefacto del respaldo existe.
- [ ] **Step 5 (Marco):** crear los dos proyectos en Vercel (`garaje-ruta-api` con raíz `backend`, `garaje-ruta` con raíz `frontend`) y cargar las variables de las *Global Constraints*.
  - El ejecutor le pasa la lista de nombres, nunca valores secretos.
  - Los secretos compartidos los genera Marco (p. ej. `openssl rand -base64 32`).
- [ ] **Step 6 (Marco):** dominio `garajeruta.marcovinir.dev` → proyecto frontend (CNAME en name.com según Vercel).
- [ ] **Step 7 (ejecutor): verificación en vivo**, anotada en la issue:
  - **API pública:** `curl -I https://garajeruta.marcovinir.dev/api/v1/catalogos/` → 200.
  - **Inicio:** sirve con fotos reales y `≈ US$` debajo del precio.
  - **Fichas:** `/autos/{slug-viejo}-{id}` → 308; `/autos/x-999999` → 404.
  - **Panel:** entrar con el demo, el colaborador y el admin por la ruta configurada, sin 403 (Review Focus 1). `/panel` responde 404 y el panel lleva `X-Robots-Tag`.
  - **Revalidación:** vender un auto desde el panel → en < 1 min no está en el inicio, `/autos` ni `sitemap.xml`, y su ficha dice «ya se vendió» (Review Focus 2). Deshacer.
  - **Next → Django:** `curl` al backend con `X-Servidor-Next` correcto ×130 → ningún 429; sin el encabezado, el límite se aplica (Review Focus 3).
  - **Login:** 11 logins fallidos con `X-Forwarded-For` distinto en cada uno → el 11.º da 429 (Review Focus 4). Si no, corregir `NUM_PROXIES` y anotar el valor.
  - **Fotos:** subir fotos desde el celular de Marco (él las elige) a un artículo de prueba. Cada foto servida pesa < 300 KB (`curl -sI` → `content-length`) (Review Focus 5). Borrar el artículo de prueba.
  - **Correo:** crear un usuario con el correo personal de Marco (él lo escribe) → llega la invitación de Resend con el enlace a `https://garajeruta.marcovinir.dev{PANEL_RUTA}/activar/…`.
  - **Búsqueda:** «corola» encuentra el Corolla (`unaccent` y `pg_trgm` en Supabase).
- [ ] **Step 8:** comentar los resultados en la issue y cerrarla.

### Task 4: E2E con Playwright (celular y escritorio)

**Files:**
- Modify: `frontend/package.json` (+ `@playwright/test`, script `e2e`), `.github/workflows/ci.yml` (job `e2e`)
- Create: `frontend/playwright.config.ts`, `frontend/e2e/{publicar,ficha,vender}.spec.ts`, `frontend/e2e/ayudas.ts`

**Interfaces:**
- **`playwright.config.ts`:**
  - `baseURL = process.env.E2E_URL ?? "http://localhost:3000"`;
  - dos proyectos, `celular` (`devices["Pixel 7"]`) y `escritorio` (1280×800);
  - `retries: 1` solo en CI;
  - reporte HTML.
- **Job `e2e` de CI:**
  - Postgres 18, `migrate`, `createcachetable` y `sembrar` con `config.settings.local`;
  - `runserver 8000` en segundo plano con `ALMACEN_FOTOS=apps.articulos.fotos.AlmacenFotosMemoria`, `FRONTEND_URL=http://localhost:3000` y `REVALIDACION_SECRETO=e2e`;
  - `npm run build && npx next start` con `REVALIDACION_SECRETO=e2e` y `BACKEND_URL=http://localhost:8000`;
  - `npx playwright install --with-deps chromium` y `npm run e2e`;
  - sube el reporte como artefacto si falla.
- **`ayudas.ts`:**
  - `entrar(page, rol)`: login por la UI con los usuarios de `sembrar` (clave local, solo en CI);
  - `simularCloudinary(page)`: `page.route("https://api.cloudinary.com/**", …)` responde `{public_id: "garaje-ruta/articulos/e2e-<n>", width: 1600, height: 1200}`.

- [ ] **Step 1: Pruebas** (fallan hasta tener la configuración)
  - `publicar.spec.ts` · **HU-01**: el admin crea un auto con 2 fotos (archivos de `e2e/fotos/*.jpg`, chicos y libres) → guardado → aparece en `/autos` con su título.
  - `ficha.spec.ts` · **HU-02/HU-03**: el HTML de la ficha (`request.get`) trae `og:title`, `og:description` con «₡» y la canónica. El botón «Consultar por WhatsApp» lleva a `https://wa.me/…?text=` con el título y la URL. Una URL con texto viejo → 308.
  - `vender.spec.ts` · **HU-04**: el admin marca «Vendido» un auto → antes de 60 s `/autos` ya no lo lista y su ficha dice «Este auto ya se vendió». «Deshacer» en el aviso → vuelve.
  - En los dos proyectos (celular y escritorio).
- [ ] **Step 2:** configuración y job. `npm run e2e` en local con Docker → PASAN.
- [ ] **Step 3:** humo contra producción: `E2E_URL=https://garajeruta.marcovinir.dev npx playwright test ficha.spec.ts` → PASA. Solo lectura: no se crean datos en producción.
- [ ] **Step 4:** PR, con el job `e2e` en verde.

### Task 5: Lighthouse CI y medición en producción

**Files:**
- Create: `frontend/lighthouserc.json`
- Modify: `.github/workflows/ci.yml` (pasos de Lighthouse en el job `e2e`, que ya tiene el stack levantado), `README.md` (notas)

**Interfaces:**
- **`lighthouserc.json`:**
  - `collect.url`: `/`, `/autos`, `/repuestos` y la ruta de una ficha que el paso de CI obtiene de `GET /api/v1/articulos/?tipo=auto&tamano=1` (`ruta`) y pasa por `LHCI_FICHA`;
  - `numberOfRuns: 3`, preset móvil;
  - `assert`: `categories:accessibility` ≥ 0,9 y `categories:seo` ≥ 0,95 con `error`; `categories:performance` ≥ 0,85 con `warn` (en CI el rendimiento es ruidoso);
  - `upload.target: temporary-public-storage`.

- [ ] **Step 1:** Configurar y correr en CI → Accesibilidad y SEO pasan la puerta.
- [ ] **Step 2:** Medición en producción con Lighthouse móvil (3 corridas, mediana) sobre las mismas páginas. Anotar las notas en el README.
  - Si Rendimiento < 85, mirar primero LCP (foto principal con `priority`, `sizes`) y JS no usado, y corregir con su prueba cuando sea de comportamiento.
  - Es la promesa pendiente del Plan 3.
- [ ] **Step 3:** PR.

### Task 6: Restauración de prueba del respaldo

**Files:**
- Modify: `docs/respaldo.md` (la fecha y el resultado de la prueba)

- [ ] **Step 1:** descargar el último artefacto de `respaldo.yml` (`gh run download`).
- [ ] **Step 2:** restaurarlo en el Postgres de Docker en `garaje_ruta_restaurada`, siguiendo `docs/respaldo.md` al pie de la letra.
- [ ] **Step 3:** comprobar que los conteos (artículos, ventas, usuarios) coinciden con los de producción el día del respaldo, y que `manage.py check` corre contra la base restaurada.
- [ ] **Step 4:** anotar fecha y resultado en `docs/respaldo.md`, borrar la base restaurada y el archivo descargado (contiene datos de producción, aunque sean ficticios). PR.

### Task 7: README de portafolio, capturas y vista previa en redes

**Files:**
- Modify: `README.md`, `docs/capturas/*` (vuelve a tomar las de la web y el panel, ahora con fotos reales)
- Create: `frontend/e2e/capturas.spec.ts` (se corre aparte con `--grep @capturas` contra producción: 360 y 1280 px, la web y el panel con el demo)

**Contenido del README:**
- **Arriba:** el enlace a la demo y la tarjeta «Probalo» con la ruta del panel, el usuario demo y su clave pública. Nota: los datos se reinician lunes y jueves.
- **Capturas** de la web y del panel, en celular y escritorio.
- **Arquitectura:** el diagrama del §5.
- **Decisiones técnicas que se pueden defender:**
  - Next 16 con `'use cache'` y etiquetas que Django revalida;
  - 308/404 reales en `proxy.ts`, porque con Cache Components la página empieza con 200;
  - «Vendí 1» con `SELECT … FOR UPDATE` y 409;
  - fotos firmadas directo a Cloudinary, sin pasar por la función de 4,5 MB;
  - el modelo 3FN;
  - permisos por código y la ruta del panel configurable;
  - precio en dólares con tipo de cambio diario y su atribución.
- **Pruebas:** cuántas hay (backend, Vitest, E2E) y cómo correrlas.
- **Lighthouse:** las notas de la tarea 5.
- **Respaldo:** cómo se respalda y cuándo se probó la restauración.
- **Limitaciones:**
  - Supabase gratis se pausa sin uso (el resembrado lo evita);
  - funciones frías de Vercel;
  - el BCCR queda pendiente en la #47.
- **Desarrollo local:** lo que ya existe.

- [ ] **Step 1:** Capturas contra producción.
- [ ] **Step 2:** Vista previa en redes (HU-02).
  - Pegar la URL de una ficha en el depurador de compartir de Facebook → la imagen de 1200×630, el título y la descripción.
  - **(Marco)** Enviarla en un chat de WhatsApp → se ve la foto, el título y el precio.
  - Anotarlo con una captura.
- [ ] **Step 3:** README; quitar «En construcción».
- [ ] **Step 4 (Marco):** ficha del proyecto en marcovinir.dev. El ejecutor pregunta en qué repo vive el sitio y le pasa el texto y las capturas.
- [ ] **Step 5:** PR `Closes #15`. Al fusionar: tachar el Plan 5 en la #1 y actualizar la memoria.
