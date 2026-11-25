# Encabezado público y WhatsApp (diseño corto)

Pedido de Marco (2026-11-25, con un prompt suyo), aprobado con cinco ajustes. Hoja de ruta: #1. Relacionado: #105 (Contacto).

## Para qué

Darle a la web pública un encabezado más claro y profesional, con un buscador que sugiera mientras se escribe, y un acceso a WhatsApp siempre a mano. **Todo lo de WhatsApp en verde.**

## Qué se construye

**Encabezado de escritorio (≥ 1024 px):**
- Fila 1: logo (archivo original) a la izquierda y buscador amplio.
- Fila 2: navegación centrada: Inicio, Autos, Repuestos, Ofertas, Contacto. «Ofertas» en rojo con ícono de etiqueta. Página activa marcada (`aria-current="page"` y subrayado rojo). Línea roja inferior delgada.
- Sticky compacto: al bajar, menos relleno y logo más chico.

**Encabezado del celular y tablet (< 1024 px):**
- Fila 1: botón de menú a la izquierda y logo centrado.
- Fila 2: buscador de ancho completo.
- Fila 3: accesos con ícono y etiqueta a Autos, Repuestos y Ofertas.
- El menú incluye Inicio y Contacto, y se cierra al navegar o con Esc.
- Al bajar se esconde la fila 3 (**ajuste 4**). Sin desbordamiento horizontal.

**Buscador con sugerencias:**
- Debounce de 300 ms y mínimo 2 letras.
- Sugerencias separadas en Autos y Repuestos, hasta 4 por grupo, con la búsqueda existente (`GET /api/v1/articulos/?q=…&tipo=auto|repuesto&tamano=4`), que ya busca por título, marca, modelo, categoría y número de parte.
- Estados de carga, sin resultados y error.
- Teclado (flechas, Enter, Esc) con el patrón combobox de ARIA.
- Opción «Ver todos los resultados» → `/buscar?q=…`. Sin JavaScript, el formulario sigue enviando a `/buscar`.

**WhatsApp:**
- **Botón flotante** circular abajo a la derecha en todas las páginas públicas: 56 px en escritorio y 52 px en el celular, a 20–24 px de los bordes más el área segura. Fondo `#25D366` con el ícono de WhatsApp en carbón (**ajuste 1**: el blanco sobre ese verde da 1,98:1). Etiqueta accesible. Número de Configuración. Mensaje general, o con el auto o repuesto en su ficha. Sin animación constante.
- **En la ficha, en el celular, no se muestra** (**ajuste 2**): ya está la barra fija con «Consultar».
- **Botones «Consultar por WhatsApp» y «Escribinos por WhatsApp»** en verde `#0E7A36` con texto blanco, 5,45:1 (**ajuste 1**).

**Contacto** (**ajuste 5**, #105): el enlace apunta al pie de la página actual (`#contacto`); todas las páginas públicas lo tienen.

**Ajuste 3:** no existe una barra superior de ubicación y horarios; no hay nada que quitar.

## Restricciones (del pedido)

Sin cambios en la base de datos, el panel, las rutas ni el contenido de los catálogos; sin dependencias nuevas; reutilizar componentes. Verificar a 360, 390, 768, 1024, 1440 y 1920 px.

## Enfoques considerados

1. **Sugerencias con la API pública existente, dos peticiones (autos y repuestos) por búsqueda** (elegido): sin tocar Django; el límite público (120/min por IP) aguanta con el debounce.
2. Un endpoint nuevo de sugerencias en Django: una sola petición, pero es backend nuevo sin necesidad.
3. Buscar en el servidor de Next: suma una capa sin ganancia.

## Decisiones del ejecutor

Íconos (SVG en línea), umbral de desplazamiento para compactar, cómo se lee el título en la ficha para el mensaje del flotante, y la estructura de componentes.
