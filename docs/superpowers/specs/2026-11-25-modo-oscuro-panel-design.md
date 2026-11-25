# Modo oscuro del panel (diseño corto)

Pedido de Marco (2026-11-24, anotado en #105) y aprobado el 2026-11-25. Hoja de ruta: #1.

## Para qué

Quien administra el patio usa el panel a cualquier hora, muchas veces desde el celular. Un modo oscuro cansa menos la vista de noche y le da al portafolio un detalle cuidado. Marco lo imaginó con un interruptor de **sol y luna en un lugar visible**.

## Qué se construye

- **Interruptor sol/luna** en el panel: en el celular, en la barra superior junto al nombre; en escritorio, en la barra lateral, arriba de «Salir» (con la barra plegada, solo el ícono). Muestra la luna en modo claro y el sol en modo oscuro. Nombre accesible: «Cambiar a modo oscuro» / «Cambiar a modo claro»; `aria-pressed` no, porque la etiqueta ya dice la acción.
- **Primera vez:** sigue el modo del sistema (`prefers-color-scheme`). Cuando la persona toca el interruptor, su elección manda.
- **Preferencia en el navegador** (`localStorage`, clave `garaje-ruta:tema`, valores `claro` / `oscuro`; sin valor = sistema). Con try/catch: si el almacenamiento falla, sigue el sistema.
- **Solo el panel**, incluidas las pantallas de acceso (login, activar, recuperar). La web pública queda clara.
- **Sin parpadeo:** un script en línea en el layout del panel pone `data-tema` en `<html>` antes de pintar. Al salir del panel (desmontar) se quita, para que la web pública no herede el modo.
- **Paleta oscura** redefiniendo los tokens de `globals.css` bajo `[data-tema="oscuro"]`, con `color-scheme: dark` (fechas, selects y barras de desplazamiento nativos):
  - fondo carbón muy oscuro, tarjetas un poco más claras, bordes y campos grises;
  - texto casi blanco y texto suave gris claro;
  - el rojo de marca se mantiene en botones; donde el rojo es texto (errores, «Quitar», «Eliminar») se usa una variante más clara;
  - etiquetas de estado (Disponible, Reservado, Vendido, Agotado) con fondos oscuros y texto claro de su color;
  - `carbon` (fondo de avisos, ítem activo del menú) pasa a un gris oscuro más claro que las tarjetas, para que siga destacando con texto blanco.
- **Logo:** `logo-completo-oscuro.svg` y `logo-simbolo-oscuro.svg` (ya existen) en modo oscuro.

## Fuera de alcance

Modo oscuro de la web pública; guardar la preferencia en la cuenta (pediría migración); un tercer estado «sistema» en el interruptor (se vuelve al sistema borrando la preferencia del navegador).

## Enfoques considerados

1. **Tokens redefinidos bajo `[data-tema="oscuro"]` en `<html>`** (elegido): un solo lugar, sin tocar pantalla por pantalla; los pocos colores fijos (`text-white` sobre `bg-carbon` o `bg-rojo`) siguen funcionando porque esos fondos se mantienen oscuros.
2. Clases `dark:` de Tailwind en cada componente: cientos de cambios y fácil olvidar uno.
3. Atributo en un `<div>` envolvente del panel en vez de `<html>`: evita limpiar al salir, pero el fondo del `<body>` y los controles nativos quedarían claros (destellos al desplazar).

## Criterios de aceptación

- Todos los pares de texto/fondo de la paleta oscura con contraste ≥ 4,5:1 (texto) y ≥ 3:1 (bordes de campos), comprobado con una prueba que calcula el contraste de los tokens.
- Pruebas: el interruptor cambia `data-tema` y lo guarda; al recargar se respeta; sin preferencia sigue `prefers-color-scheme`; con `localStorage` roto no rompe; al desmontar el panel se quita el atributo.
- Revisión en el navegador del listado, el formulario, configuración, usuarios, un diálogo y un aviso, en celular y escritorio, en los dos modos. Lighthouse Accesibilidad sigue en 100 en modo oscuro.

## Decisiones del ejecutor

Los valores exactos de cada color (cumpliendo el contraste), el ícono (SVG en línea, no emoji) y el nombre de los componentes.
