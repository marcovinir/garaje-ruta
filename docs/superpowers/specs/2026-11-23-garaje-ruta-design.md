# Garaje Ruta — Diseño

**Fecha:** 2026-11-23 · **Estado:** borrador para aprobación · **Repo:** `marcovinir/garaje-ruta` (público)
**Documento de origen:** `Proyectos/proyectos-clientes/catalogo-autos-repuestos.md` (v2, como «MotorPatio»). Este diseño lo reemplaza donde no coincidan.

## 1. Intención

Proyecto de **portafolio** de Marco y, a la vez, **base de referencia** para clientes reales parecidos (catálogos e inventario de negocios pequeños).

**Garaje Ruta** es un patio **ficticio** que vende **autos usados y repuestos** y hasta ahora dependía de Facebook Marketplace. El proyecto le da un canal propio:
- una **web pública tipo catálogo**, renderizada en el servidor, cuyos enlaces se ven con foto, título y precio al compartirlos en WhatsApp o Facebook;
- un **panel privado `/panel`** para publicar y administrar desde el celular (y también cómodo en tablet y escritorio).

**Flujo que define el éxito** (si funciona de punta a punta, el proyecto está completo):

```
Admin sube el auto o repuesto una vez desde el celular
  → aparece en la web con filtros y página propia
  → el comprador recibe o encuentra el enlace (vista previa con foto y precio)
  → pulsa «Consultar por WhatsApp» (chat con el enlace ya escrito)
  → al venderse se marca «Vendido» y sale del catálogo
```

Frente a **Sonrisa Viva** (el proyecto anterior de Marco, con el mismo backend Django), lo nuevo que demuestra es: **Next.js con renderizado en servidor, Open Graph y SEO**, fotos subidas directo a **Cloudinary** desde el celular, **compatibilidad de repuestos** por modelo y año, **concurrencia de inventario** («Vendí 1») y **precio en dólares con tipo de cambio real**.

## 2. Objetivos, no-objetivos y anti-objetivos

**Objetivos** (etapas 1 y 2 del documento de origen, obligatorias):
- Catálogo público de autos y repuestos, con búsqueda por texto, filtros combinables guardados en la URL y orden.
- Página por artículo con galería, todos sus datos, Open Graph y botón «Consultar por WhatsApp».
- Enlace de artículo vendido o agotado: «Este artículo ya se vendió» + tres similares (nunca un 404).
- Inicio con destacados, accesos a Autos y Repuestos, y contacto (WhatsApp, horario, mapa).
- `sitemap.xml` y `robots.txt` con los artículos disponibles.
- Panel: login, listado con búsqueda y filtros, crear y editar autos y repuestos, subida múltiple de fotos con compresión, reordenar fotos, estados, «Vendí 1», copiar enlace / compartir, duplicar artículo, usuarios con roles, configuración del negocio.
- **Precio principal en colones y equivalente en dólares** con el tipo de cambio del día.
- **Web y panel responsivos** en todas las pantallas (de 360 px a escritorio), diseñados primero para celular.
- Desplegado con URL pública, datos de ejemplo, usuario demo de solo lectura y README de portafolio.

**Etapa 3 (extra, si da el tiempo):** historial de cambios visible, reportes (vendidos por mes, días promedio en venta, más vistos) y etiquetas imprimibles con QR. **El modelo de datos ya las soporta desde el inicio** (ver §6), para no migrar después.

**No-objetivos:** pagos en línea, facturación electrónica, publicación automática en Facebook, chat propio, app nativa, varias sucursales, otros idiomas, cuentas de compradores.

**Anti-objetivos (fracaso aunque funcione):**
- Que dos «Vendí 1» simultáneos dejen una cantidad negativa o vendan más de lo que hay.
- Que un enlace compartido en WhatsApp salga sin foto o sin precio.
- Que un artículo vendido siga apareciendo en listados o buscador más de 1 minuto.
- Que el colaborador pueda borrar o gestionar usuarios llamando a la API directamente.
- Que el panel sea incómodo en el celular, o que en escritorio se vea como un celular estirado.
- Que el sitio dependa de que la API del tipo de cambio esté arriba.

## 3. Restricciones

- **Stack:** monorepo con `backend/` (Django 5.2 + DRF + PostgreSQL) y `frontend/` (Next.js App Router + React + TypeScript).
- **Reutilizar Sonrisa Viva** (repo `marcovinir/sonrisa-viva`), copiando y adaptando a mano, sin arrastrar código de citas o dentistas:
  - `apps/cuentas` (usuario con `AbstractBaseUser`, rol, permiso, rol_permiso, login por sesión, activación y recuperación de contraseña, `permisos.py` como fuente única);
  - `apps/comun` (clase DRF `TienePermiso`, paginación, formato de errores, notificaciones/correo);
  - `config/settings/{base,local,produccion,pruebas}.py` con los ajustes de Vercel serverless + pooler de Supabase;
  - el patrón `services.py` / `selectors.py`, el comando `sembrar`, y los workflows `ci.yml`, `migrar.yml` y `resembrar.yml`.
- **Hospedaje gratuito (RNF-11, $0–15/mes):**
  - **Vercel** ×2: proyecto `frontend` (Next.js) y proyecto `backend` (Django como función Python).
  - **Supabase Postgres** vía la URL del **pooler** (la conexión directa es solo IPv6). `CONN_MAX_AGE=0` y `DISABLE_SERVER_SIDE_CURSORS=True`. El proyecto gratis se pausa tras ~7 días sin uso: el workflow de resembrado lo mantiene activo y el README lo anota.
  - **Cloudinary** (plan gratis) para las fotos.
- **Límite de Vercel:** el cuerpo de una petición a una función no puede pasar de **4,5 MB**, así que **las fotos nunca pasan por Django** (ver §8).
- **Docker solo para desarrollo** (lo pidió Marco, aunque en otros proyectos individuales no lo usó): `docker compose up` levanta Django + Postgres. Next.js corre con `npm run dev`. El Postgres del contenedor se publica en el puerto **5433** para no chocar con el PostgreSQL 18 que Marco tiene instalado en el 5432. En CI se usa el servicio de Postgres de GitHub Actions.
- **Base de datos en 3FN**, ORM de Django, restricciones en la base como última defensa. **SOLID** en el backend, **heurísticas de Nielsen** en el frontend.
- **Región:** español, colones (`₡6 500 000`), zona horaria `America/Costa_Rica`; fechas en UTC en la base.
- **Datos 100 % ficticios** (RNF-15): ~40 autos y ~80 repuestos, fotos libres de derechos o generadas, WhatsApp ficticio configurable.
- **Flujo de trabajo:** issues autosuficientes en GitHub con la **#1 «Hoja de ruta y convenciones»**, un PR por issue, `main` protegida con los checks de CI. Los IDs RF/RNF/HU del documento de origen se citan en issues, pruebas y PRs.

## 4. Enfoques considerados

**Cómo reutilizar Sonrisa Viva**
1. Copiar el repo y recortar. Rápido, pero arrastra código muerto y un historial ajeno. Descartado.
2. **Repo nuevo, traer las piezas a mano, frontend nuevo en Next.js.** ← **elegido por Marco.** Cada pieza se revisa al traerla y el historial cuenta la historia de Garaje Ruta. Lo reutilizable está casi todo en el backend (Sonrisa Viva usa Vite, no Next.js).
3. Paquete compartido entre los dos proyectos. Demasiado para dos proyectos de portafolio. Descartado.

**Arquitectura de frontend** (decidida en el documento de origen): una sola app de Next.js con la web pública renderizada en servidor y `/panel` como componentes de cliente, y `/api/*` reenviado a Django. La alternativa de plantillas de Django + panel React estático es más barata pero no practica Next.js.

**Moneda** (decidida por Marco): el precio se guarda **solo en colones**; el dólar se **calcula** con el tipo de cambio del día. Guardar los dos precios rompería la 3FN y se desincronizaría; guardar el precio en la moneda que elija el vendedor complicaría filtros y orden.

## 5. Arquitectura

```
          Navegador · WhatsApp · Facebook · Google
                           │
                           ▼
   Vercel · frontend (Next.js)
     • /, /autos, /repuestos, /autos/[slug]…  → renderizado en servidor + ISR
     • /panel/*                                → React en el navegador
     • /api/*  → rewrite (mismo origen) ──────────┐
                           │ servidor a servidor   │
                           ▼                       ▼
   Vercel · backend (Django + DRF, función Python)
     • API REST, sesiones + CSRF, permisos, firma de subida
                │                          │
                ▼                          ▼
   Supabase Postgres (pooler)     Cloudinary (fotos)
                ▲
   GitHub Actions: migrar · resembrar · actualizar tipo de cambio (BCCR)
```

- **Rewrite `/api/*`:** el navegador ve un solo dominio, así que la cookie de sesión de Django (`HttpOnly` + `Secure` + `SameSite=Lax`) y el CSRF funcionan sin CORS. Igual que en Sonrisa Viva, pero configurado en `next.config.ts`.
- **Páginas públicas:** los Server Components llaman a Django **servidor a servidor** con `fetch` y caché de Next (ISR) etiquetada por artículo y por listado.
- **Frescura (HU-04, < 1 min):** cada cambio de estado, precio o fotos hace que Django llame a un endpoint de revalidación de Next (`POST /api/revalidar`, protegido con un secreto compartido) con las etiquetas afectadas. Como respaldo, `revalidate: 60` en listados y detalle. Si la llamada falla, solo se registra en el log: el cambio se guarda igual.
- **Dominio sugerido:** `garajeruta.marcovinir.dev` → proyecto frontend.

## 6. Modelo de datos (3FN)

PK `id` bigint en todas las tablas (salvo las de subtipo, cuya PK es la FK a `articulo`). Nombres en español, `snake_case`. El diagrama entidad-relación que Marco revisó está en la conversación del 2026-11-23; esta tabla es la fuente de verdad.

**Cuentas (de Sonrisa Viva, sin cambios):** `rol`, `permiso`, `rol_permiso`, `usuario` (email de login, nombre, apellidos, `rol_id`, `is_active`, `password`, `last_login`, `creado_en`).

**Catálogos**

| Tabla | Campos | Notas |
|---|---|---|
| `marca` | `nombre` (único), `slug` (único) | |
| `modelo` | `marca_id`, `nombre`, `slug` | Único `(marca_id, nombre)` y `(marca_id, slug)`. |
| `transmision` | `nombre` (único) | Manual, Automática, CVT… |
| `combustible` | `nombre` (único) | Gasolina, Diésel, Híbrido, Eléctrico… |
| `carroceria` | `nombre` (único) | Sedán, Hatchback, SUV, Pickup… |
| `categoria_pieza` | `padre_id` (nullable, FK a sí misma), `nombre`, `slug` (único) | Árbol: Motor > Alternador. Filtrar por una categoría incluye sus descendientes. Profundidad máx. 3 (validada en el servicio). |

Son tablas y no `choices` para que el admin agregue valores sin tocar el código.

**Artículos**

| Tabla | Campos | Notas |
|---|---|---|
| `articulo` | `tipo` (`auto`/`repuesto`), `titulo`, `descripcion`, `precio_colones`, `estado`, `destacado`, `publicado_en`, `creado_por` (FK usuario), `creado_en`, `actualizado_en` | `estado`: `disponible`, `reservado`, `vendido`, `oculto`. Check `precio_colones >= 0`. |
| `auto` | `articulo_id` (PK y FK), `modelo_id`, `anio`, `version`, `kilometraje`, `transmision_id`, `combustible_id`, `carroceria_id` (nullable), `color`, `cilindrada_cc`, `puertas` | Checks: `anio` entre 1950 y el año siguiente al actual, `kilometraje >= 0`. |
| `repuesto` | `articulo_id` (PK y FK), `categoria_pieza_id`, `condicion` (`nuevo`/`usado`), `cantidad`, `codigo_interno` (único, nullable), `numero_parte` | Check `cantidad >= 0`. |
| `compatibilidad` | `repuesto_id`, `modelo_id`, `anio_desde`, `anio_hasta` | Check `anio_desde <= anio_hasta`. Un repuesto puede tener varias filas. |
| `foto` | `articulo_id`, `public_id` (Cloudinary), `ancho`, `alto`, `orden` | Único `(articulo_id, orden)` diferible. **La principal es `orden = 1`.** |

**Registro de actividad**

| Tabla | Campos | Notas |
|---|---|---|
| `venta` | `articulo_id`, `cantidad`, `precio_unitario_colones`, `registrada_por`, `fecha` | Check `cantidad > 0`. Autos: una venta de 1 al marcar «Vendido». Repuestos: una por cada «Vendí N». |
| `vista_diaria` | `articulo_id`, `fecha`, `cantidad` | Único `(articulo_id, fecha)`; se incrementa con `F() + 1` en un `upsert`. |
| `historial_cambio` | `articulo_id`, `usuario_id`, `accion`, `detalle` (JSON con antes/después), `fecha` | Se llena desde la etapa 1; la pantalla que lo muestra es de la etapa 3. |
| `tipo_cambio` | `fecha` (única), `compra`, `venta`, `fuente`, `obtenido_en` | Decimal(10,2). Uno por día. |

**Configuración**

| Tabla | Campos | Notas |
|---|---|---|
| `configuracion_negocio` | `nombre`, `logo_public_id`, `whatsapp`, `direccion`, `mapa_url` | Una sola fila (singleton, `pk = 1`). |
| `horario_atencion` | `configuracion_id`, `dia_semana` (0–6), `apertura`, `cierre` | Check `apertura < cierre`. Permite turnos partidos. |

**Decisiones de 3FN (cambios respecto al documento de origen):**
- `auto` y `compatibilidad` **no guardan `marca_id`**: la marca depende del modelo (dependencia transitiva).
- **No existe el estado «agotado»**: es `tipo = repuesto` y `cantidad = 0`. La web pública muestra `estado = disponible` y, si es repuesto, `cantidad > 0`. El panel muestra «Agotado» como etiqueta calculada.
- **Sin `fecha_venta` ni `vistas` en `articulo`**: salen de `venta` y `vista_diaria`.
- **Sin `es_principal` en `foto`**: es la de `orden = 1`.
- **Sin columna `slug` en `articulo`**: la URL se genera como `{texto}-{id}` (p. ej. `/autos/toyota-corolla-2015-123`). Se busca **por el id final**; si el texto no coincide con el actual (porque cambió el título), se responde **308 a la URL canónica**. Así el enlace es permanente aunque se edite el título.
- **`titulo` no es derivado**: en autos el formulario lo propone («Toyota Corolla 2015») pero el usuario puede editarlo («Toyota Corolla 2015 SE full extras»).
- **`venta.precio_unitario_colones` es una instantánea histórica**, no una dependencia transitiva: si mañana cambia el precio, la venta registrada no cambia (mismo argumento que `cita.precio_colones` en Sonrisa Viva).
- **El dólar no se guarda**: `precio_usd = precio_colones / tipo_cambio.venta` del día más reciente.
- `articulo.tipo` es el discriminador del subtipo; el servicio garantiza que exista exactamente la fila de `auto` o de `repuesto` que corresponde, en la misma transacción.

**Búsqueda (RF-06):** búsqueda de texto completo de Postgres con configuración `spanish` + extensión `unaccent` (se activa en una migración; Supabase la soporta), sobre título, descripción, marca, modelo, categoría y número de parte, con índice GIN. «corola» sin tilde o con errores leves se cubre además con `pg_trgm` sobre el título.

## 7. Reglas de negocio

**Estados**
- Transiciones: `disponible ↔ reservado`, `disponible|reservado ↔ oculto`, `disponible|reservado → vendido` (solo autos).
- **Auto → Vendido:** en una transacción crea la `venta` (cantidad 1, precio actual) y cambia el estado. **Deshacer** (`vendido → disponible`) borra esa venta y lo registra en el historial.
- **Repuesto → «Vendí N»** (por defecto 1): en una transacción con `SELECT … FOR UPDATE` sobre la fila de `repuesto`, valida `cantidad >= N`, descuenta y crea la `venta`. Si no alcanza, responde **409** «Solo quedan X». Un repuesto no pasa a `vendido`: al llegar a 0 queda agotado. Se puede **deshacer** la última venta desde el toast (borra la venta y devuelve la cantidad, con el mismo bloqueo).
- **Reponer cantidad** de un repuesto es editar el campo `cantidad` (queda en el historial).
- **Eliminar** (solo admin): solo si el artículo no tiene ventas; si tiene, se usa `oculto`. Al eliminar se borran sus fotos de Cloudinary.

**Página pública de un artículo**
- `disponible` o `reservado`: ficha completa; `reservado` muestra una etiqueta «Reservado» y el botón de WhatsApp sigue activo.
- `vendido`, `oculto` o repuesto agotado: «Este artículo ya se vendió» (o «Este repuesto se agotó») + 3 similares, con HTTP 200 y `noindex`. Un `oculto` no muestra ningún dato del artículo.
- **Similares:** del mismo tipo y disponibles. Autos: mismo modelo, luego misma marca, luego precio ±30 %. Repuestos: misma categoría y compatibles con algún modelo del original, luego misma categoría. Se completa hasta 3 con destacados recientes.

**WhatsApp (HU-03):** `https://wa.me/<whatsapp de la configuración>?text=` + `Hola, me interesa: {titulo} – {URL canónica}`, codificado.

**Precio en dólares**
- Se muestra como `₡6 500 000` y debajo `≈ US$12 450` (redondeado a la decena).
- Se usa el **tipo de cambio de venta** del registro más reciente de `tipo_cambio`. Si tiene más de 3 días, igual se muestra, pero el panel avisa. Si no hay ninguno, el dólar no se muestra (la página nunca falla por esto).
- Filtros y orden por precio: **solo en colones**.
- **Fuente:** el servicio web de indicadores del **Banco Central de Costa Rica (BCCR)** (gratuito; requiere registrarse con un correo para obtener un token, paso que hace Marco). Respaldo si el BCCR falla: `open.er-api.com` (gratis, sin clave). Las dos se ocultan detrás de una interfaz `ProveedorTipoCambio`.
- Un comando `python manage.py actualizar_tipo_cambio` guarda el del día; lo corre un workflow de GitHub Actions diario (6:00 de Costa Rica). Nunca se consulta la API durante una visita.

**Vistas (para «más vistos»):** el detalle público envía, ya en el navegador, `POST /api/v1/vistas/{id}/` una vez por artículo y sesión de navegador (marca en `sessionStorage`), con *throttling* por IP. Los bots no ejecutan ese JS, así que no inflan el conteo.

## 8. Fotos

- **Desde el celular:** `<input type="file" accept="image/*" multiple>` con un botón para cámara (`capture="environment"`) y otro para galería.
- **Compresión en el navegador** antes de subir: lado mayor 2000 px, WebP o JPEG a ~0,8, y se corrige la orientación EXIF.
- **Subida directa a Cloudinary** con **firma**: el panel pide `POST /api/v1/panel/fotos/firma/` (requiere permiso de editar), Django devuelve la firma de Cloudinary con carpeta y tiempo; el navegador sube cada foto directo a Cloudinary en paralelo (máx. 3 a la vez) con barra de progreso; al terminar, el panel guarda en Django los `public_id`, `ancho`, `alto` y el `orden`.
- **Entrega:** las URLs se arman desde `public_id` con `f_auto,q_auto` y anchos 400/800/1200 para `srcset`, más carga diferida (RNF-04). HU-01: cada foto servida en la web pesa < 300 KB.
- **Open Graph:** `og:image` = la principal a 1200×630 con `c_fill`, URL absoluta (HU-02).
- **Reordenar y elegir la principal** (RF-27): arrastrar en escritorio; en el celular, mantener pulsado para arrastrar, más un botón «Hacer principal».
- Fotos de ejemplo: subidas a Cloudinary una vez por el comando `sembrar` (o tomadas de una carpeta de Cloudinary ya cargada si existe).
- Límite: 15 fotos por artículo.

## 9. Roles y permisos

Se reutiliza el sistema de Sonrisa Viva: `TienePermiso("codigo")` en cada vista de DRF, y `permisos.py` como fuente única que la migración de datos siembra.

| Permiso | Admin | Colaborador | Demo |
|---|:-:|:-:|:-:|
| `articulos.ver` (panel) | ✔ | ✔ | ✔ |
| `articulos.crear` / `articulos.editar` | ✔ | ✔ | |
| `articulos.cambiar_estado` / `ventas.registrar` | ✔ | ✔ | |
| `articulos.eliminar` | ✔ | | |
| `catalogos.agregar` (marca, modelo, categoría nuevos desde el formulario) | ✔ | ✔ | |
| `catalogos.gestionar` (editar y borrar catálogos) | ✔ | | |
| `usuarios.gestionar` | ✔ | | |
| `configuracion.editar` | ✔ | | |
| `reportes.ver` / `historial.ver` | ✔ | ✔ | ✔ |

- **HU-06:** las acciones sin permiso responden **403** aunque se llamen fuera de la interfaz; cada permiso tiene su prueba de API.
- **Demo:** un usuario de solo lectura publicado en el README; el resembrado deja todo como estaba.
- Reglas de usuarios heredadas: un admin no puede desactivarse a sí mismo y siempre debe quedar al menos un admin activo.
- Login con límite de intentos (RNF-07) por *throttling* de DRF sobre el endpoint de login.
- **Ruta del panel configurable (pedido de Marco):** la variable `PANEL_RUTA` del frontend define la ruta pública del panel (en local `/panel`; en producción algo no obvio, p. ej. `/gestion-9x2`). Internamente el código vive en `app/panel/`; un `middleware.ts` reescribe `PANEL_RUTA/*` → `/panel/*`, y si `PANEL_RUTA` no es `/panel`, una petición directa a `/panel/*` responde **404**. Todos los enlaces internos del panel se arman con un helper que usa `PANEL_RUTA`. El panel lleva `X-Robots-Tag: noindex` y **no** aparece en `sitemap.xml` ni en `robots.txt` (listarlo ahí lo delataría). Reduce el ruido de bots; **no reemplaza** los permisos de la API, que siguen siendo la seguridad real. En el demo la ruta se publica en el README junto al usuario de solo lectura.
- **Fuera de alcance:** Cloudflare Access u otro acceso previo tipo Zero Trust (Marco lo descartó: cerraría el demo y el DNS de `marcovinir.dev` está en name.com).

## 10. API (resumen)

Todo bajo `/api/v1/`. Errores en el formato de Sonrisa Viva: `{ "detalle": "...", "campos": {...} }`.

- **Público:**
  - `GET articulos/?tipo=&q=&marca=&modelo=&anio_min=&anio_max=&precio_min=&precio_max=&categoria=&condicion=&transmision=&combustible=&compatible_marca=&compatible_modelo=&compatible_anio=&orden=recientes|precio_asc|precio_desc&page=` (RF-01, 02, 06–09, 12).
  - `GET articulos/{id}/` (incluye estado para decidir «ya se vendió») y `GET articulos/{id}/similares/`.
  - `GET destacados/`, `GET catalogos/` (marcas con modelos, categorías en árbol, transmisiones, combustibles, carrocerías — para armar los filtros), `GET configuracion/`, `GET tipo-cambio/`.
  - `GET sitemap/` (ids, textos de URL y `actualizado_en` de los disponibles) para que Next genere `sitemap.xml`.
  - `POST vistas/{id}/`.
- **Autenticación:** la de Sonrisa Viva (`auth/csrf`, `login`, `logout`, `yo`, `activar`, `recuperar`, `restablecer`).
- **Panel:** CRUD de `panel/articulos/` (con filtros por estado, tipo y fecha, RF-30; acciones `estado/`, `vender/`, `deshacer-venta/`, `duplicar/`, `fotos/` para guardar y reordenar), `panel/fotos/firma/`, CRUD de catálogos, `panel/usuarios/`, `panel/configuracion/` (con horarios), `panel/historial/?articulo=`, y en la etapa 3 `panel/reportes/…`.

## 11. Frontend

**Next.js (App Router) + React + TypeScript + Tailwind CSS.** En el panel: TanStack Query, React Hook Form + Zod.

```
frontend/src/
  app/
    (publico)/       page.tsx (inicio), autos/, autos/[slug]/, repuestos/, repuestos/[slug]/, buscar/
    panel/           login/, (protegido)/ articulos/, articulos/nuevo/, articulos/[id]/, usuarios/, configuracion/, reportes/
    api/revalidar/   route.ts (revalidación por etiquetas, con secreto)
    sitemap.ts, robots.ts, opengraph por artículo vía generateMetadata
  features/          catalogo/, detalle/, filtros/, panel-articulos/, fotos/, auth/, usuarios/, configuracion/
  shared/            ui/, api/ (cliente del navegador con CSRF y cliente de servidor), lib/ (colones, dólares, slugs, WhatsApp)
```

- **Público:** Server Components; los filtros viven en los `searchParams` (compartibles, RF-07). En el celular, los filtros abren una **hoja que sube desde abajo**; en escritorio, una **barra lateral fija**. Galería deslizable en el celular y con miniaturas en escritorio. En el detalle, el botón de WhatsApp queda **fijo abajo** en el celular y en la columna lateral en escritorio.
- **Panel responsivo (requisito de Marco):**
  - Celular (< 768 px): navegación inferior, listado en **tarjetas** con acciones rápidas (Editar, Vendido / Vendí 1, Copiar enlace), formularios a una columna.
  - Tablet (768–1023 px): tarjetas en dos columnas, menú lateral plegable.
  - Escritorio (≥ 1024 px): menú lateral fijo, listado en **tabla** con orden por columna y acciones en línea, formulario a dos columnas (datos | fotos).
- **Compartir (RF-29):** `navigator.share` cuando existe; si no, se copia al portapapeles con un toast.
- **Nielsen y accesibilidad:** como en Sonrisa Viva (estados visibles con color y texto, confirmación antes de acciones destructivas, deshacer en el toast, errores que dicen cómo seguir, contraste AA, teclado completo, `aria-live`). Metas Lighthouse móvil: Rendimiento ≥ 85, SEO ≥ 95, Accesibilidad ≥ 90.
- **Identidad visual:** la propuesta del documento de origen (fondo oscuro, acento naranja, sans robusta) se decide con **mockups en Claude Design** antes de escribir el frontend: inicio, listado con filtros, detalle, artículo vendido, y en el panel listado, formulario con fotos y usuarios, cada uno en celular y escritorio.

## 12. Calidad y flujo de trabajo

- **Backend:** `pytest` + `pytest-django` contra Postgres real. Prioridades: filtros y compatibilidad (HU-05), visibilidad pública por estado y cantidad (RF-09, HU-04), «Vendí 1» con hilos en paralelo (`django_db(transaction=True, serialized_rollback=True)`, como en Sonrisa Viva), permisos por rol (HU-06), URL canónica con 308, tipo de cambio con proveedor falso.
- **Frontend:** Vitest + Testing Library; **Playwright** para HU-01 a HU-04 (publicar con fotos, ver Open Graph en el HTML, WhatsApp, marcar vendido), en viewport de celular y de escritorio.
- **CI (GitHub Actions):** lint + pruebas del backend con servicio Postgres; lint + pruebas + build del frontend; **Lighthouse CI** sobre el build en las páginas públicas.
- **Workflows programados:** `migrar.yml` (manual), `resembrar.yml` (lunes y jueves), `tipo-cambio.yml` (diario).
- **Git:** `main` protegida, rama por issue (`feat/12-filtros`), PR con `Closes #N`, CI en verde.
- **Sin secretos en el repo** (RNF-09): `.env.example` en `backend/` y `frontend/`.
- **Datos de ejemplo:** `python manage.py sembrar [--reiniciar]` crea catálogos (marcas y modelos comunes en Costa Rica), ~40 autos, ~80 repuestos con compatibilidades, fotos, la configuración, los usuarios de ejemplo (admin, colaborador, demo) y ~6 meses de ventas y vistas para que los reportes tengan datos.
- **Respaldo (RNF-10):** respaldo diario de Supabase (incluido en el plan gratis) más un `pg_dump` semanal desde GitHub Actions guardado como artefacto, y **una restauración de prueba documentada** en el README.

## 13. Fases (borrador del orden de las issues)

0. Repo, README inicial, Docker Compose de desarrollo, CI, protección de `main`, esqueleto del backend (piezas traídas de Sonrisa Viva) y del frontend Next.js.
1. Mockups en Claude Design e identidad visual.
2. Backend: modelos, migraciones (incluye `unaccent` y `pg_trgm`), restricciones, permisos y `sembrar`.
3. Backend: API pública (listados, filtros, búsqueda, detalle, similares, catálogos, sitemap, vistas, configuración).
4. Backend: API del panel (CRUD, estados, ventas con bloqueo, duplicar, fotos con firma de Cloudinary, usuarios, configuración, historial) y revalidación de Next.
5. Backend: tipo de cambio (BCCR + respaldo) y su workflow.
6. Frontend: sistema de diseño y web pública (inicio, listados con filtros, detalle con Open Graph, vendido, sitemap).
7. Frontend: panel (login, listado responsivo, formulario con fotos, estados, Vendí 1, compartir, usuarios, configuración).
8. Despliegue (Vercel ×2 + Supabase + Cloudinary), dominio, Playwright, Lighthouse, respaldo restaurado, README de portafolio y página en marcovinir.dev.
9. Etapa 3 (si da el tiempo): historial visible, reportes, etiquetas con QR.

**Plazo:** sin fecha límite (decisión de Marco). Se prefiere completo y bien hecho: la etapa 3, Lighthouse CI y Playwright en celular y escritorio entran en el alcance.

**Cómo se planifica** (igual que en Sonrisa Viva):
- Un **plan por bloque**, y cada uno se escribe cuando el anterior ya está ejecutado: plan 1 = fases 0 y 2 (cimientos y modelos), plan 2 = fases 3 a 5 (API y tipo de cambio), plan 3 = fase 6 (web pública), plan 4 = fase 7 (panel), plan 5 = fase 8 (despliegue). La etapa 3 queda como apéndice, con plan propio si da el tiempo.
- Cada plan se convierte en **issues autosuficientes** enlazadas desde la #1.
- **Los mockups (fase 1) los genera Claude en Claude Design y Marco los aprueba.** Se hacen mientras avanza el backend; los planes 3 y 4 (frontend) no se escriben hasta tenerlos aprobados.

## 14. Decisiones que tomé yo (revisar)

- Repo `marcovinir/garaje-ruta`, carpeta `Proyectos/garaje-ruta`, dominio `garajeruta.marcovinir.dev`.
- Postgres de Docker en el puerto 5433.
- Catálogos (transmisión, combustible, carrocería) como tablas; categorías de pieza en árbol.
- Sin estado «agotado», sin `slug` guardado, sin `es_principal`: todo se deriva (§6).
- Un repuesto nunca pasa a «Vendido»; se agota al llegar a 0. «Deshacer» la última venta desde el toast.
- Un artículo con ventas no se puede eliminar, solo ocultar.
- Revalidación de Next por etiquetas llamada desde Django, con `revalidate: 60` de respaldo.
- BCCR como fuente del tipo de cambio y `open.er-api.com` de respaldo; tipo de cambio de **venta**; dólares redondeados a la decena.
- Conteo de vistas desde el navegador, una por sesión.
- Rol **Demo** de solo lectura además de Admin y Colaborador.
- El colaborador puede **agregar** marcas, modelos y categorías desde el formulario, pero no editarlas ni borrarlas.
- Límite de 15 fotos por artículo; compresión a 2000 px antes de subir.

## 15. A criterio de quien implemente

Versiones exactas de librerías, nombres internos, textos de marketing, paleta concreta (sale de los mockups), la librería de compresión de imágenes y la de arrastrar y soltar, y los detalles del *throttling*.
