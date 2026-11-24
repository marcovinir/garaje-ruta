# Plan 3 — Web pública en Next.js: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** la web pública de Garaje Ruta (inicio, listados de autos y repuestos con filtros en la URL, búsqueda, fichas con Open Graph, artículo vendido, sitemap y robots) con la identidad aprobada, renderizada en el servidor y que se actualiza sola cuando el panel cambia algo.

**Architecture:** Next.js 16 App Router con `cacheComponents`. Las páginas son Server Components que leen la API de Django desde el servidor con funciones `'use cache'` etiquetadas (`cacheTag`) y `cacheLife`; Django avisa los cambios a `POST /api/revalidar` (contrato del Plan 2) y ahí se invalida con `revalidateTag(etiqueta, { expire: 0 })`. Lo interactivo (galería, hoja de filtros en celular, compartir, contador de vistas) son Client Components pequeños. Fotos desde Cloudinary con un loader propio de `next/image`.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, Tailwind CSS v4, `next/font/google` (Saira, Saira Condensed), Vitest + Testing Library. Guías: skill UI/UX Pro Max y `modern-web-guidance` (instalada en `.agents/skills/`; consultar con `DISABLE_TELEMETRY=1 npx modern-web-guidance search "<tema>"`).

**Spec:** `docs/superpowers/specs/2026-11-23-garaje-ruta-design.md` (§5, §7, §8, §11). **Mockups aprobados:** https://claude.ai/artifact/UU9fVdfzyPRwWmdNseRvuQ (páginas «Identidad» y «Web pública»); tokens y reglas en la issue #11; notas para este plan en la #13.

## Global Constraints

- Lo del Plan 1 y 2 sigue vigente (español, PR por issue, `main` protegida, fusionar con CI en verde).
- **Leer `frontend/AGENTS.md` y la guía de `node_modules/next/dist/docs/` antes de usar una API de Next**: la versión 16 cambió caché (`'use cache'`, `cacheTag`, `cacheLife`, `revalidateTag(tag, perfil)` con dos argumentos), `middleware` → `proxy` y `params`/`searchParams` asíncronos.
- **Identidad (aprobada, #11):** fondo `#F4F4F2`, tarjetas `#FFFFFF`, bordes `#DEDED9`, campos `#EEEEEB`, texto `#151517`, texto suave `#55565B`, carbón `#1C1C1E`, rojo `#E11D2E` (hover `#B3141F`, suave `#FDECEE`). Estados: disponible `#DCF5E7`/`#146C43`, reservado `#DCEBFB`/`#1D4F91`, vendido `#ECEEF1`/`#3A3B40`, agotado `#FDE7DF`/`#9A3412`. Títulos y precios **Saira Condensed 800 en mayúsculas**; texto **Saira**. Logo: `frontend/public/marca/` (SVG vectorizado del de ChatGPT).
- **Precio:** colones grande; **dólares debajo**, pequeño y gris (`≈ US$14 500`); nunca al lado. Formato `₡6 500 000` (espacio fino no separable `\u202F` entre miles).
- **Animaciones sencillas** solo dentro de `@media (prefers-reduced-motion: no-preference)`: tarjetas suben 3 px con sombra al pasar el mouse, foto con zoom 1.04 (0.35 s), botones 0.98 al presionar, secciones con fundido de 8 px (0.45 s). Nada más (sin parallax ni carruseles automáticos).
- **Accesibilidad:** contraste AA, objetivos táctiles ≥ 44 px, foco visible, `alt` en todas las fotos, navegación completa con teclado. Responsive desde 360 px sin scroll horizontal.
- **Datos:** el servidor llama a Django en `BACKEND_URL` con el encabezado `X-Servidor-Next: {SERVIDOR_NEXT_SECRETO}` (variables solo de servidor). El navegador solo llama a `/api/v1/vistas/{id}/` (por el rewrite).
- **Atribución:** el pie dice «Tipo de cambio: Rates By Exchange Rate API» con enlace a https://www.exchangerate-api.com (condición de open.er-api.com).
- **Pruebas:** `cd frontend && npm test` (Vitest) + `npm run lint`, `format:check` y `build`. Las páginas se revisan además con el backend sembrado (`docker compose up -d` + `sembrar`) y `npm run dev`.

## Review Focus

1. **Un auto recién vendido** → a lo sumo un minuto después ya no está en inicio, listados ni sitemap, y su URL muestra «Este auto ya se vendió» con similares (no 404). → tareas 5 y 6.
2. **URL vieja de un artículo cuyo título cambió** (`/autos/toyota-corolla-2015-12` cuando ahora es «…-2015-se-12») → redirección 308 a la canónica; un id que no existe → 404. → tarea 5.
3. **Filtros combinados compartidos por WhatsApp** (`/autos?marca=3&anio_min=2015&equipamiento=1,4&orden=precio_asc`) → abren con los mismos filtros marcados, chips visibles y «Limpiar» funciona; parámetros basura no rompen la página. → tarea 4.
4. **Celular de 360 px** → nada se sale de la pantalla: hoja de filtros, galería, precio con dólares debajo y botón de WhatsApp fijo abajo en la ficha. → tareas 3–5.
5. **Django caído o lento** → la página muestra un mensaje amable y lo que tenga en caché; nunca la pantalla de error de Next. → tareas 1 y 3.

---

### Task 1: Base: tokens, fuentes, logo, cliente de la API y utilidades

**Files:**
- Create: `frontend/src/app/globals.css` (reemplaza el de create-next-app), `frontend/public/marca/{logo-completo,logo-completo-oscuro,logo-simbolo,logo-simbolo-oscuro}.svg`, `frontend/src/app/icon.svg`
- Create: `frontend/src/shared/lib/{dinero,cloudinary,whatsapp,rutas}.ts`, `frontend/src/shared/api/{servidor,tipos}.ts`, `frontend/src/shared/config/entorno.ts`
- Modify: `frontend/src/app/layout.tsx`, `frontend/.env.example`, `frontend/next.config.ts` (`images.loaderFile`)
- Create: `frontend/src/shared/lib/cargador-imagenes.ts`
- Test: `frontend/src/shared/lib/*.test.ts`, `frontend/src/shared/api/servidor.test.ts`
- Also: versionar `.agents/skills/modern-web-guidance/` y `skills-lock.json`; agregar `.claude/skills/` a `.gitignore` (el enlace que crea el instalador apunta a una ruta absoluta de la máquina); crear las issues de las tareas 2–7 y enlazarlas en la #1.

**Interfaces:**
- Produces: `globals.css` con `@theme` de Tailwind v4: colores `--color-fondo`, `--color-tarjeta`, `--color-borde`, `--color-campo`, `--color-tinta`, `--color-tinta-suave`, `--color-carbon`, `--color-rojo`, `--color-rojo-oscuro`, `--color-rojo-suave` y los 8 de estados (valores de Global Constraints); fuentes `--font-titulos` (Saira Condensed) y `--font-texto` (Saira); clase utilitaria `.titulo` (mayúsculas, 800); y el bloque de animaciones con `prefers-reduced-motion`.
- Produces: `layout.tsx` carga Saira y Saira Condensed con `next/font/google` (`display: "swap"`, subconjunto `latin`), `lang="es"`, `metadataBase` desde `SITIO_URL`.
- Produces: `dinero.ts`: `colones(n: number): string` → `"₡6 500 000"`; `dolares(n: number | null): string | null` → `"≈ US$14 500"`.
- Produces: `cloudinary.ts`: `urlFoto(publicId: string, opciones: { ancho?: number; alto?: number; recorte?: boolean }): string` → `https://res.cloudinary.com/{NEXT_PUBLIC_CLOUDINARY_CLOUD}/image/upload/f_auto,q_auto,w_{ancho}[,h_{alto},c_fill]/{publicId}`; sin nube configurada devuelve `/marca/foto-pendiente.svg`. `cargador-imagenes.ts` = loader de `next/image` que usa `urlFoto`.
- Produces: `whatsapp.ts`: `enlaceWhatsapp(numero: string, titulo: string, urlArticulo: string): string` → `https://wa.me/{numero}?text=` + `encodeURIComponent("Hola, me interesa: {titulo} – {url}")`.
- Produces: `rutas.ts`: `idDeSlug(slug: string): number | null` (igual a `id_de_ruta` de Django) y `urlAbsoluta(ruta: string): string` con `SITIO_URL`.
- Produces: `servidor.ts` (`import "server-only"`): `api<T>(ruta: string, opciones?: { etiquetas?: string[]; vida?: "minutes" | "hours" }): Promise<T>` — función con `'use cache'`, `cacheTag(...etiquetas)` y `cacheLife(vida ?? "minutes")`; agrega `X-Servidor-Next`; lanza `ErrorApi(status)`; y funciones tipadas `obtenerArticulos(params)`, `obtenerDestacados()`, `obtenerFicha(id)`, `obtenerSimilares(id)`, `obtenerCatalogos()`, `obtenerConfiguracion()`, `obtenerTipoCambio()`, `obtenerSitemap()` con las etiquetas `articulos`, `articulo-{id}`, `catalogos`, `configuracion`.
- Produces: `tipos.ts` con los tipos de las respuestas del Plan 2 (`Tarjeta`, `Ficha` con `estado_publico`, `Catalogos`, `Configuracion`, `TipoCambio`, `Pagina<T>`).
- Produces: `entorno.ts` con `BACKEND_URL`, `SERVIDOR_NEXT_SECRETO`, `REVALIDACION_SECRETO`, `SITIO_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD` (los de servidor nunca se importan desde un Client Component).

- [ ] **Step 1: Pruebas que fallan:** `colones(6500000) === "₡6\u202F500\u202F000"`; `dolares(14500) === "≈ US$14\u202F500"` y `dolares(null) === null`; `urlFoto` con y sin recorte; `urlFoto` sin nube → placeholder; `enlaceWhatsapp` codifica tilde, `–` y la URL; `idDeSlug("toyota-corolla-2015-12") === 12`, `idDeSlug("abc") === null`; `api()` con `fetch` simulado envía `X-Servidor-Next` y lanza `ErrorApi(503)`.
- [ ] **Step 2:** `npm test` → FALLA.
- [ ] **Step 3:** Implementar; copiar los 4 SVG del logo (están en el lienzo de mockups; también en `C:\Users\marco\Proyectos\garaje-ruta\frontend\public\marca\` si ya se copiaron en el PR del plan) y crear `icon.svg` desde `logo-simbolo.svg`.
- [ ] **Step 4:** `npm test`, `lint`, `format:check`, `build` → PASAN. Commit, PR.

### Task 2: Componentes compartidos de la web

**Files:**
- Create: `frontend/src/features/publico/componentes/{Encabezado,PieDePagina,TarjetaArticulo,Precio,EtiquetaEstado,BotonWhatsapp,Foto,MensajeError}.tsx`
- Test: `frontend/src/features/publico/componentes/*.test.tsx`

**Interfaces:**
- Produces: `<Precio colones={n} dolares={m | null} anterior?={n} tamano="tarjeta" | "ficha" />`: colones en `.titulo`; «Antes ₡…» tachado arriba si hay anterior; `≈ US$…` debajo en texto suave.
- Produces: `<TarjetaArticulo tarjeta={Tarjeta} prioridad?={boolean} />`: enlace a `tarjeta.ruta`; `next/image` 4:3 con `sizes` adecuados y `priority` solo cuando se pasa (la primera del inicio, LCP); etiqueta «OFERTA» si hay precio anterior; auto: «km · transmisión · combustible»; repuesto: «condición · compatibilidad_resumen».
- Produces: `<Encabezado />` (logo, navegación Autos/Repuestos/Ofertas/Contacto, buscador en escritorio; menú en celular con `<details>` o `<dialog>`), `<PieDePagina configuracion={…} />` (horario, dirección, mapa, WhatsApp y la atribución del tipo de cambio), `<BotonWhatsapp numero titulo url fijo?={boolean} />`, `<EtiquetaEstado estado />`, `<MensajeError />` («No pudimos cargar el catálogo. Probá de nuevo en un momento.»).

- [ ] **Step 1: Pruebas que fallan:** `Precio` muestra el dólar en un elemento posterior (debajo) y no lo muestra sin tipo de cambio; `TarjetaArticulo` de oferta muestra «OFERTA» y «Antes»; de repuesto muestra la compatibilidad; enlace accesible con el título; `BotonWhatsapp` tiene el `href` de `enlaceWhatsapp`; `Encabezado` tiene nombre accesible en el menú de celular.
- [ ] **Step 2:** FALLA. **Step 3:** implementar siguiendo los mockups. **Step 4:** PASA. Commit, PR.

### Task 3: Inicio

**Files:**
- Modify: `frontend/src/app/page.tsx` (y su prueba)
- Create: `frontend/src/app/(publico)/layout.tsx` (encabezado + pie), `frontend/src/app/error.tsx`, `frontend/src/app/not-found.tsx`, `frontend/src/app/loading.tsx`

**Interfaces:**
- Produces: inicio del mockup: titular, buscador, accesos Autos/Repuestos con conteos, carrocerías (de `catalogos`), «OFERTAS» (destacados con precio anterior) y «RECIÉN LLEGADOS» (destacados), contacto. Cada bloque de datos dentro de `<Suspense>` con esqueleto, para que un fallo o lentitud de Django no tumbe la página (Review Focus 5). `generateMetadata` con título y descripción del negocio.

- [ ] **Step 1: Prueba que falla:** la página (con `obtenerDestacados`/`obtenerCatalogos`/`obtenerConfiguracion` simulados) muestra «OFERTAS», «RECIÉN LLEGADOS» y las carrocerías; con `obtenerDestacados` rechazando, muestra `MensajeError` y el resto sigue.
- [ ] **Step 2:** FALLA. **Step 3:** implementar. **Step 4:** PASA; revisar con el backend sembrado en `npm run dev` a 360 px y 1280 px. Commit, PR.

### Task 4: Listados, filtros y búsqueda

**Files:**
- Create: `frontend/src/app/(publico)/autos/page.tsx`, `repuestos/page.tsx`, `buscar/page.tsx`
- Create: `frontend/src/features/publico/filtros/{filtrosDesdeUrl,PanelFiltros,HojaFiltros,ChipsFiltros,Orden,Paginacion}.tsx|ts`
- Test: `frontend/src/features/publico/filtros/*.test.ts(x)`

**Interfaces:**
- Produces: `filtrosDesdeUrl(params: Record<string, string | string[] | undefined>, tipo: "auto" | "repuesto"): Record<string, string>` — se queda solo con los parámetros del §10 válidos para ese tipo (números enteros, listas de ids), descarta el resto; `aQueryString(filtros): string`.
- Produces: los filtros son un `<form method="get">` (funcionan sin JavaScript); en escritorio barra lateral fija; en celular botón «Filtros (n)» que abre un `<dialog>` modal como hoja inferior (`modern-web-guidance`: dialog). Chips de filtros activos con «×» (enlaces que quitan ese parámetro) y «Limpiar». Orden (`recientes`, `precio_asc`, `precio_desc`) y paginación por enlaces.
- Produces: `/autos` y `/repuestos` usan `obtenerArticulos({...filtros, tipo})`; `/repuestos` incluye «Buscar por vehículo» (marca → modelo → año, `compatible_*`). `/buscar?q=` muestra autos y repuestos.

- [ ] **Step 1: Pruebas que fallan:** `filtrosDesdeUrl` conserva `marca=3&anio_min=2015&equipamiento=1,4&orden=precio_asc`, descarta `anio_min=abc`, `foo=1` y en repuestos descarta `km_max`; `ChipsFiltros` genera el enlace sin el filtro quitado; `PanelFiltros` marca los valores recibidos (Review Focus 3); `HojaFiltros` abre y cierra el `<dialog>` y devuelve el foco al botón.
- [ ] **Step 2:** FALLA. **Step 3:** implementar. **Step 4:** PASA; revisar a 360 px que la hoja no se sale (Review Focus 4). Commit, PR.

### Task 5: Ficha, vendido y Open Graph

**Files:**
- Create: `frontend/src/app/(publico)/autos/[slug]/page.tsx`, `repuestos/[slug]/page.tsx` (comparten `features/publico/ficha/`)
- Create: `frontend/src/features/publico/ficha/{PaginaFicha,Galeria,DatosAuto,DatosRepuesto,Equipamiento,Compartir,ContadorVistas,NoDisponible}.tsx`
- Test: `frontend/src/features/publico/ficha/*.test.tsx`

**Interfaces:**
- Produces: la página toma `id = idDeSlug(slug)`; sin id → `notFound()`; `obtenerFicha(id)` 404 → `notFound()`; si la sección (`autos`/`repuestos`) o el texto no coinciden con `ficha.ruta` → `permanentRedirect(ficha.ruta)` (308; Review Focus 2).
- Produces: según `estado_publico`: `disponible`/`reservado` → ficha completa del mockup (etiqueta «Reservado» si aplica); `vendido`/`agotado` → `<NoDisponible>` «Este auto ya se vendió» / «Este repuesto se agotó» + `obtenerSimilares` (3 tarjetas) + botones a listados y WhatsApp; `no_disponible` → «Este artículo ya no está disponible» + similares, sin datos. Estos tres con `robots: { index: false }`.
- Produces: `<Galeria fotos>` (Client): foto principal con `priority`, deslizable en celular (scroll-snap) y miniaturas en escritorio, accesible con teclado (botones «Foto n de m»); `<Compartir>`: `navigator.share` si existe, si no copia la URL y avisa con un `role="status"`; `<ContadorVistas id>`: un `POST /api/v1/vistas/{id}/` por sesión (`sessionStorage`), sin bloquear nada.
- Produces: `generateMetadata`: `title` = título del artículo; `description` con precio en colones y datos clave; `openGraph.images` = `urlFoto(principal, { ancho: 1200, alto: 630, recorte: true })` absoluta; `alternates.canonical` = `urlAbsoluta(ficha.ruta)`.
- Produces: botón «Consultar por WhatsApp» fijo abajo en celular y en la columna lateral en escritorio.

- [ ] **Step 1: Pruebas que fallan:** ruta con texto viejo → `permanentRedirect` con la canónica; id inexistente → `notFound`; ficha vendida muestra «Este auto ya se vendió» y 3 similares; `no_disponible` no muestra título; `generateMetadata` arma `og:image` absoluta 1200×630 con `c_fill` y `description` con «₡6 500 000»; `Galeria` cambia de foto con teclado; `Compartir` sin `navigator.share` copia y anuncia; `ContadorVistas` llama una sola vez por sesión.
- [ ] **Step 2:** FALLA. **Step 3:** implementar. **Step 4:** PASA; revisar a 360 px (Review Focus 4). Commit, PR.

### Task 6: Revalidación, sitemap y robots

**Files:**
- Create: `frontend/src/app/api/revalidar/route.ts`, `frontend/src/app/sitemap.ts`, `frontend/src/app/robots.ts`
- Test: `frontend/src/app/api/revalidar/route.test.ts`, `frontend/src/app/sitemap.test.ts`

**Interfaces:**
- Produces: `POST /api/revalidar`: exige `Authorization: Bearer {REVALIDACION_SECRETO}` (comparación en tiempo constante; si falta o no coincide → 401; si el secreto no está configurado → 503); cuerpo `{"etiquetas": string[]}` (máx. 50, cada una `^[a-z0-9-]{1,64}$`, si no → 400); llama `revalidateTag(etiqueta, { expire: 0 })` por cada una (Review Focus 1: la siguiente visita ya ve el cambio) y responde `{"revalidadas": n}`.
- Produces: `sitemap.ts` = inicio, `/autos`, `/repuestos` + `obtenerSitemap()` con `lastModified`; `robots.ts` permite todo salvo `/api/` y enlaza el sitemap. El panel no aparece (Plan 4).

- [ ] **Step 1: Pruebas que fallan:** sin token → 401; token equivocado → 401; cuerpo inválido → 400; válido → `revalidateTag` simulado recibe cada etiqueta con `{ expire: 0 }`; `sitemap()` incluye las rutas absolutas de los artículos.
- [ ] **Step 2:** FALLA. **Step 3:** implementar. **Step 4:** PASA. Prueba de punta a punta manual: con Docker y `npm run dev`, poner `REVALIDACION_SECRETO` igual en `backend/.env` y `frontend/.env.local`, vender un auto desde la API del panel y comprobar que desaparece del listado al recargar (Review Focus 1). Commit, PR.

### Task 7: Pulido, accesibilidad y cierre

**Files:**
- Modify: lo que salga de la revisión; `frontend/README.md`; `README.md` (sección «Web pública» con capturas a 360 px y 1280 px).

- [ ] **Step 1:** Revisar las páginas con `npm run build && npm start` y el backend sembrado: Lighthouse móvil en inicio, listado y ficha (metas del diseño: Rendimiento ≥ 85, SEO ≥ 95, Accesibilidad ≥ 90). Consultar `modern-web-guidance` (`optimize-image-priority`, `html`, `css-layout`) para lo que baje la nota.
- [ ] **Step 2:** Corregir hallazgos con su prueba cuando sean de comportamiento.
- [ ] **Step 3:** Capturas para el README; anotar las notas de Lighthouse. Commit, PR `Closes #13`; tachar el Plan 3 en la #1.
