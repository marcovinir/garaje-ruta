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

## Estado

En construcción. La hoja de ruta está en la issue #1 y el diseño en [`docs/superpowers/specs/`](docs/superpowers/specs/).
