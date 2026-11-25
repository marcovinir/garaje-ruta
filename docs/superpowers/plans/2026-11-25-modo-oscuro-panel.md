# Modo oscuro del panel — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** modo oscuro para el panel con un interruptor sol/luna, que sigue al sistema hasta que la persona elige y se recuerda en el navegador.

**Architecture:** los colores ya son tokens de Tailwind 4 en `frontend/src/app/globals.css`. Se redefinen bajo `[data-tema="oscuro"]` en `<html>`; un script en línea en el layout del panel pone el atributo antes de pintar, y un componente cliente lo quita al salir del panel. El interruptor vive en `MarcoPanel`.

**Tech Stack:** Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-25-modo-oscuro-panel-design.md`

## Global Constraints

- Solo el panel (incluye login, activar, recuperar y restablecer); la web pública no cambia.
- Preferencia en `localStorage`, clave `garaje-ruta:tema`, valores `claro` / `oscuro`; sin valor = `prefers-color-scheme`. Todo acceso al almacenamiento con try/catch.
- Contraste ≥ 4,5:1 para texto y ≥ 3:1 para el borde de los campos, en los dos modos.
- Íconos SVG en línea, nunca emoji. Textos en voseo.
- Una issue, una rama, un PR «Closes #n»; fusionar con el CI en verde.

## Review Focus

1. **Destello claro al cargar en modo oscuro:** el script en línea debe correr antes de que se pinte el contenido del panel (y no esperar a la hidratación). Lo cubre la Tarea 2 (prueba del script) y la revisión en el navegador de la Tarea 4.
2. **Volver a la web pública desde el panel** (enlace «Ver en la web» o «Salir») con modo oscuro: la web no debe quedar oscura. Prueba en la Tarea 2 (desmontar quita el atributo).
3. **`localStorage` bloqueado** (navegación privada o datos del sitio bloqueados): el panel abre siguiendo al sistema y el interruptor cambia el modo en la pestaña aunque no se pueda guardar. Prueba en la Tarea 2.
4. **Botón «Eliminar» y avisos de error en oscuro:** el rojo como texto se aclara, pero el fondo del botón de peligro debe seguir oscuro con texto blanco. Prueba de contraste en la Tarea 1.
5. **Controles nativos** (fechas, selects, barra de desplazamiento) claros sobre fondo oscuro: `color-scheme: dark` en el bloque oscuro. Revisión en el navegador en la Tarea 4.

---

### Task 1: Paleta oscura y prueba de contraste

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/features/panel/ui/estilos.ts` (`BOTON_PRIMARIO` y `BOTON_PELIGRO` usan `rojo-fuerte` como fondo)
- Modify: los demás usos de `bg-rojo-oscuro` / `hover:bg-rojo-oscuro` del panel, que pasan a `rojo-fuerte`
- Test: `frontend/src/app/contraste.test.ts`

**Interfaces:**
- Produces: token nuevo `--color-rojo-fuerte` (`#b3141f` en los dos modos: fondo de botones con texto blanco); `--color-rojo-oscuro` queda como «rojo para texto» (en oscuro, uno claro); variante de Tailwind `oscuro:` declarada con `@custom-variant oscuro (&:where([data-tema=oscuro], [data-tema=oscuro] *));`.

- [ ] **Step 1: Prueba de contraste que falla.** `contraste.test.ts` lee `globals.css` con `fs`, extrae los valores de los tokens del bloque `@theme` (claro) y del bloque `[data-tema="oscuro"]` (oscuro), y para cada modo comprueba con la fórmula de luminancia relativa de WCAG:
  - ≥ 4,5: `tinta` sobre `fondo`, `tarjeta` y `campo`; `tinta-suave` sobre `fondo`, `tarjeta` y `campo`; `rojo-oscuro` sobre `tarjeta`, `fondo` y `rojo-suave`; blanco (`#ffffff`) sobre `rojo`, `rojo-fuerte` y `carbon`; cada `*-tinta` de estado sobre su fondo (`disponible`, `reservado`, `vendido`, `agotado`).
  - ≥ 3: `borde-campo` sobre `campo` y sobre `tarjeta`.
  - Nombre: `it.each(["claro", "oscuro"])("el modo %s cumple el contraste mínimo", …)`, y el mensaje de cada fallo dice el par y la razón.
- [ ] **Step 2:** `npx vitest run src/app/contraste.test.ts` → falla el modo oscuro (no hay bloque) y quizá `rojo-fuerte`.
- [ ] **Step 3:** agregar `--color-rojo-fuerte` al `@theme`, el bloque `[data-tema="oscuro"] { color-scheme: dark; --color-…: …; }` con todos los tokens de color, y la variante `oscuro:`. Valores a elección, cumpliendo la prueba; como punto de partida: fondo `#141416`, tarjeta `#1f2023`, campo `#2a2b2f`, borde `#34353a`, tinta `#f2f2f0`, `carbon` `#3a3b40`.
- [ ] **Step 4:** cambiar los fondos rojos con texto blanco a `rojo-fuerte` (`BOTON_PRIMARIO` hover, `BOTON_PELIGRO`, y lo que encuentre `grep -rn "bg-rojo-oscuro" src`).
- [ ] **Step 5:** `npx vitest run` (todo) → pasa. Commit.

### Task 2: Lógica del tema, script sin destello y limpieza al salir

**Files:**
- Create: `frontend/src/features/panel/ui/tema.ts`
- Create: `frontend/src/features/panel/ui/TemaPanel.tsx`
- Modify: `frontend/src/app/panel/layout.tsx`
- Test: `frontend/src/features/panel/ui/tema.test.tsx`

**Interfaces:**
- Produces, en `tema.ts`:
  - `type Tema = "claro" | "oscuro"`;
  - `CLAVE_TEMA = "garaje-ruta:tema"`;
  - `leerPreferencia(): Tema | null` (null si no hay o si el almacenamiento falla);
  - `temaInicial(): Tema` (preferencia, si no `matchMedia("(prefers-color-scheme: dark)")`);
  - `aplicarTema(tema: Tema): void` (pone `document.documentElement.dataset.tema`);
  - `guardarTema(tema: Tema): void` (try/catch);
  - `SCRIPT_TEMA: string` (el mismo cálculo de `temaInicial` + `aplicarTema`, autocontenido, envuelto en try/catch, para un `<script>` en línea);
  - `useTema(): { tema: Tema; alternar: () => void }` (estado inicial desde `document.documentElement.dataset.tema`; `alternar` aplica y guarda).
- Produces: `TemaPanel` (cliente, sin salida visible) que en el efecto de limpieza borra `document.documentElement.dataset.tema`.

- [ ] **Step 1: Pruebas que fallan** en `tema.test.tsx`:
  - `sin preferencia sigue al sistema`: `matchMedia` simulado con `matches: true` → `temaInicial()` es `"oscuro"`; con `false` → `"claro"`.
  - `la preferencia guardada manda sobre el sistema`: `localStorage` con `oscuro` y sistema claro → `"oscuro"`.
  - `con el almacenamiento roto sigue al sistema y alternar igual cambia el modo`: `localStorage.getItem`/`setItem` que lanzan → `temaInicial()` usa el sistema; un componente con `useTema` alterna y `document.documentElement.dataset.tema` cambia sin lanzar.
  - `alternar guarda la elección`: tras alternar, `localStorage.getItem(CLAVE_TEMA)` es el nuevo tema.
  - `el script en línea aplica el tema`: `new Function(SCRIPT_TEMA)()` con preferencia `oscuro` → `dataset.tema === "oscuro"`.
  - `al salir del panel se quita el modo`: render de `<TemaPanel />` con `dataset.tema = "oscuro"`, `unmount()` → `dataset.tema` es `undefined`.
- [ ] **Step 2:** `npx vitest run src/features/panel/ui/tema.test.tsx` → falla (no existe el módulo).
- [ ] **Step 3:** implementar `tema.ts` y `TemaPanel.tsx`. En `app/panel/layout.tsx`, antes de los proveedores: `<script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />` y `<TemaPanel />`.
- [ ] **Step 4:** `npx vitest run`, `npx eslint src`, `npx tsc --noEmit` → pasan. `npm run build` compila sin errores de Cache Components. Commit.

### Task 3: Interruptor sol/luna y logos oscuros

**Files:**
- Create: `frontend/src/features/panel/ui/InterruptorTema.tsx`
- Modify: `frontend/src/features/panel/estructura/MarcoPanel.tsx` (barra superior del celular y barra lateral, arriba de «Salir»; los dos logos)
- Modify: `frontend/src/features/panel/auth/MarcoAcceso.tsx` (logo)
- Test: `frontend/src/features/panel/estructura/estructura.test.tsx`

**Interfaces:**
- Consumes: `useTema()` de la Tarea 2; variante `oscuro:` de la Tarea 1.
- Produces: `InterruptorTema({ compacto?: boolean })`: botón `type="button"`, `aria-label` «Cambiar a modo oscuro» en claro y «Cambiar a modo claro» en oscuro, ícono SVG de luna (claro) o sol (oscuro) con `aria-hidden`; `compacto` muestra solo el ícono (barra plegada y celular), si no, ícono y texto «Modo oscuro» / «Modo claro». Tamaño táctil ≥ 44 px.

- [ ] **Step 1: Pruebas que fallan** en `estructura.test.tsx`:
  - `el interruptor de la barra lateral cambia a modo oscuro y su nombre cambia`: con `dataset.tema` borrado y sistema claro, clic en «Cambiar a modo oscuro» → `document.documentElement.dataset.tema === "oscuro"` y el botón ahora se llama «Cambiar a modo claro».
  - `la barra superior del celular también tiene el interruptor`: dentro del `header` del celular hay un botón «Cambiar a modo oscuro».
- [ ] **Step 2:** correrlas → fallan.
- [ ] **Step 3:** implementar `InterruptorTema` y ubicarlo. Logos: dos `<img>` (normal con `oscuro:hidden`, oscuro con `hidden oscuro:block`), `logo-completo-oscuro.svg` y `logo-simbolo-oscuro.svg`; el oscuro con `alt=""` para no repetir el nombre.
- [ ] **Step 4:** `npx vitest run`, eslint, `tsc` → pasan. Commit.

### Task 4: Revisión en el navegador, Lighthouse y PR

- [ ] **Step 1:** con `next dev` y el backend local, en 375 px y en escritorio, en los dos modos: listado, formulario de auto (incluido el selector de fechas del listado), configuración, usuarios, el diálogo «¿Marcar como vendido?» y un aviso con «Deshacer». Sin destello claro al recargar en oscuro; al entrar a la web pública desde el panel, la web está clara. Capturas de prueba del listado en oscuro (celular y escritorio).
- [ ] **Step 2:** Lighthouse Accesibilidad del listado en modo oscuro (con `localStorage` en `oscuro`) → 100.
- [ ] **Step 3:** PR «Modo oscuro del panel» con `Closes` de la issue; CI en verde; fusionar. Marcar la sección 6 de #105 como hecha y actualizar la memoria.
