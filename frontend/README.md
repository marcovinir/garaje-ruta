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
- `src/features/publico/`: `componentes/` (tarjeta, precio, encabezado, pie…), `inicio/`, `filtros/` (filtros en la URL, hoja del celular, búsqueda) y `ficha/` (galería, datos, compartir, vistas).
- `src/shared/api/`: `servidor.ts` (llamadas a Django desde Next) y `datos.ts` (lecturas cacheadas con sus etiquetas).
- `src/shared/lib/`: dinero, Cloudinary, WhatsApp, rutas.

## Decisiones

- Las secciones con datos esperan la petición (`connection()`) dentro de `Suspense`: el build no llama a Django.
- La ficha usa `instant = false`: espera sus datos (cacheados) antes de responder, así una URL vieja recibe un **308** real y un id inexistente un **404**.
- Dentro de `'use cache'` un error cambia de clase: los 404 esperables se piden con `pedirOpcional()`, que devuelve `null`.
