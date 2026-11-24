# Garaje Ruta

Catálogo web y panel de administración para **Garaje Ruta**, un patio que vende autos usados y repuestos.

> **Negocio ficticio.** Todos los datos (autos, repuestos, precios, teléfonos) son de ejemplo. Proyecto de portafolio.

El patio publicaba todo en Facebook Marketplace. Este proyecto le da un canal propio:

- una **web pública tipo catálogo**, renderizada en el servidor, cuyos enlaces se ven con foto, título y precio al compartirlos en WhatsApp o Facebook, con el botón «Consultar por WhatsApp»;
- un **panel privado** para publicar y administrar desde el celular (y también cómodo en tablet y escritorio).

## Stack

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS.
- **Backend:** Django 5.2 + Django REST Framework + PostgreSQL.
- **Fotos:** Cloudinary. **Despliegue:** Vercel + Supabase.
- **Desarrollo:** Docker Compose (Django + PostgreSQL).

## Cómo correrlo

Requisitos: Docker Desktop y Node 24.

```bash
docker compose up -d                                        # PostgreSQL 18 (puerto 5433) y Django (8000)
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py sembrar    # datos de ejemplo
docker compose run --rm backend pytest -q                   # pruebas del backend

cd frontend
npm install
npm run dev                                                 # http://localhost:3000
npm test
```

Usuarios de ejemplo (contraseña `Demo-Garaje-2026`): `admin@garajeruta.test`, `colaborador@garajeruta.test` y `demo@garajeruta.test` (solo lectura).

## Estado

En construcción. La hoja de ruta está en la issue #1 y el diseño en [`docs/superpowers/specs/`](docs/superpowers/specs/).
