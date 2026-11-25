# Encabezado público y WhatsApp — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** encabezado público nuevo (escritorio y celular), buscador con sugerencias, botón flotante de WhatsApp y todo lo de WhatsApp en verde.

**Architecture:** componentes cliente en `frontend/src/features/publico/encabezado/`; el botón flotante se monta en el `Pie` del layout público, que ya trae la configuración (el número). Sin cambios de backend.

**Tech Stack:** Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, Vitest + Testing Library + MSW.

**Spec:** `docs/superpowers/specs/2026-11-25-encabezado-whatsapp-design.md`

## Global Constraints

- Verdes: `--color-whatsapp: #25D366` (fondo del flotante, ícono carbón) y `--color-whatsapp-fuerte: #0E7A36` (botones con texto blanco), con hover más oscuro.
- Flotante: 56 px (≥ 768 px) y 52 px (< 768 px); a 20–24 px de los bordes más `env(safe-area-inset-*)`; oculto en la ficha por debajo de `lg`.
- Sugerencias: debounce 300 ms, mínimo 2 letras, 4 por grupo, `GET /api/v1/articulos/?q=&tipo=&tamano=4`.
- Sin cambios de base de datos, panel, rutas ni dependencias. Voseo.

## Review Focus

1. **Respuestas fuera de orden** al escribir rápido: solo se muestran las de la última búsqueda (AbortController). Prueba en la Tarea 3.
2. **El flotante tapa botones** (la barra fija de la ficha en el celular, «Aplicar» de la hoja de filtros): oculto en la ficha < lg; revisión en el navegador en la Tarea 4.
3. **Menú del celular abierto al navegar:** se cierra al cambiar de ruta y con Esc. Prueba en la Tarea 2.
4. **Teclado en el buscador:** las flechas recorren autos, repuestos y «Ver todos»; Enter sin selección envía a `/buscar`; Esc cierra. Prueba en la Tarea 3.
5. **Contacto en la página actual:** `#contacto` llega al pie también en páginas que cargan por partes. Revisión en el navegador en la Tarea 4.

---

### Task 1: Verdes de WhatsApp y botón flotante

**Files:** `src/app/globals.css`, `src/app/contraste.test.ts`, `src/features/publico/componentes/BotonWhatsapp.tsx` (verde e ícono real de WhatsApp), `PieDePagina.tsx` (botón verde), `src/features/publico/componentes/WhatsappFlotante.tsx` (nuevo), `src/app/(publico)/layout.tsx`, pruebas en `componentes.test.tsx`.

**Produces:** `WhatsappFlotante({ numero }: { numero: string })`.

- [ ] **Pruebas que fallan:**
  - contraste: `blanco` sobre `whatsapp-fuerte` ≥ 4,5 y `carbon` sobre `whatsapp` ≥ 3;
  - el flotante enlaza a `wa.me/<numero>` con el mensaje general y tiene `aria-label` «Escribinos por WhatsApp»;
  - en una ficha (`/autos/toyota-corolla-2018-12`) el mensaje lleva el título del `h1` y la URL, y el flotante lleva la clase que lo oculta < lg;
  - «Consultar por WhatsApp» usa el verde fuerte.
- [ ] Implementar y pasar; commit.

### Task 2: Encabezado de escritorio y celular, Contacto

**Files:** `src/features/publico/encabezado/{Encabezado.tsx,Navegacion.tsx,MenuCelular.tsx,useDesplazado.ts}` (reemplazan `componentes/Encabezado.tsx`), pruebas en `encabezado/encabezado.test.tsx`.

- [ ] **Pruebas que fallan:**
  - en `/autos` el enlace «Autos» lleva `aria-current="page"`, y en `/autos?ofertas=1` lo lleva «Ofertas»;
  - «Ofertas» tiene su ícono;
  - «Contacto» apunta a `#contacto`;
  - el menú del celular tiene Inicio y Contacto, y se cierra con Esc y al cambiar de ruta;
  - los accesos del celular (Autos, Repuestos, Ofertas) existen.
- [ ] Implementar y pasar; commit.

### Task 3: Buscador con sugerencias

**Files:** `src/features/publico/encabezado/Buscador.tsx`, `buscador.test.tsx`.

- [ ] **Pruebas que fallan** (MSW, timers falsos):
  - no pide antes de 300 ms ni con 1 letra;
  - muestra los grupos Autos y Repuestos, con hasta 4 cada uno;
  - «Sin resultados» y error;
  - flechas + Enter van a la ruta del ítem;
  - Enter sin selección y «Ver todos los resultados» van a `/buscar?q=`;
  - Esc cierra;
  - una respuesta vieja que llega tarde no pisa la nueva.
- [ ] Implementar (combobox ARIA: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`/`option`) y pasar; commit.

### Task 4: Verificación y PR

- [ ] `vitest`, eslint, `tsc`, `next build`.
- [ ] En el navegador a 360, 390, 768, 1024, 1440 y 1920 px: sin desbordamiento, encabezado compacto al bajar, menú, buscador con teclado, Contacto, flotante sin tapar nada (ficha y hoja de filtros).
- [ ] Revisión final independiente; PR con «Closes» del issue; CI; fusionar.
