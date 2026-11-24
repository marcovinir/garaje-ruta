# Garaje Ruta · frontend

Next.js 16 (App Router, `cacheComponents`). Ver el README de la raíz del repo.

```bash
npm install
npm run dev     # http://localhost:3000, reenvía /api/v1 a BACKEND_URL (por defecto localhost:8000)
npm test        # Vitest
npm run lint && npm run format:check && npm run build
```

Variables en `.env.example` (copiar a `.env.local`).

## Estructura

- `src/app/(publico)/`: inicio, `autos/`, `repuestos/` (listado y `[slug]`), `buscar/`.
- `src/app/api/revalidar/`: recibe de Django las etiquetas a invalidar.
- `src/app/sitemap.ts`, `robots.ts`.
- `src/app/panel/`: login, activar/restablecer/recuperar y `(protegido)/` (artículos, nuevo, editar, usuarios, configuración, catálogos).
- `src/features/panel/`: `auth/`, `estructura/` (guardia de sesión, marco responsivo), `articulos/` (listado y acciones), `formulario/`, `fotos/` (compresión, subida a Cloudinary, cola), `usuarios/`, `configuracion/`, `catalogos/`, `ui/`.
- `src/test/`: MSW con datos parecidos a `sembrar`, `renderPanel()` y un `next/navigation` falso.
- `src/features/publico/`: `componentes/` (tarjeta, precio, encabezado, pie…), `inicio/`, `filtros/` (filtros en la URL, hoja del celular, búsqueda) y `ficha/` (galería, datos, compartir, vistas).
- `src/shared/api/`: `servidor.ts` (llamadas a Django desde Next) y `datos.ts` (lecturas cacheadas con sus etiquetas).
- `src/shared/lib/`: dinero, Cloudinary, WhatsApp, rutas.

## Decisiones

- Las secciones con datos esperan la petición (`connection()`) dentro de `Suspense`: el build no llama a Django.
- Con Cache Components una página empieza a enviarse con **200** antes de saber si el artículo existe (ni `instant = false` lo evita). Por eso el **308** a la URL canónica y el **404** de las fichas los responde `src/proxy.ts`, que consulta a Django antes de renderizar. Si Django no responde, deja pasar y la página muestra su aviso.
- Dentro de `'use cache'` un error cambia de clase: los 404 esperables se piden con `pedirOpcional()`, que devuelve `null`.
- El panel lee la API desde el navegador (TanStack Query) con la cookie de sesión y el CSRF de Django. Django responde **403 también sin sesión**: ante un 403 se vuelve a pedir `auth/yo` para distinguir una sesión vencida (al login con `siguiente`) de la falta de permiso.
- `src/proxy.ts` también reescribe `NEXT_PUBLIC_PANEL_RUTA` → `/panel`.
