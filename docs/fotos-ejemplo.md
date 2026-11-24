# Fotos de ejemplo

Garaje Ruta es un negocio ficticio: sus fotos de ejemplo son **generadas** (ChatGPT), no tomadas de terceros.

- 24 de autos (`auto-01` … `auto-24`) y 16 de repuestos (`repuesto-01` … `repuesto-16`).
- Formato horizontal 4:3 (ideal 1600×1200), JPG o PNG.
- Se guardan en `backend/semillas/fotos/` (ignorada por git) con el nombre exacto de la tabla.
- Se suben con:

```bash
docker compose run --rm backend python manage.py subir_fotos_ejemplo --carpeta semillas/fotos
```

El comando las sube a Cloudinary como `garaje-ruta/ejemplo/<nombre>` y actualiza el ancho y alto de las fotos sembradas. Hace falta `CLOUDINARY_URL` en `backend/.env`.

## Estilo común (se agrega a cada prompt)

> Fotografía realista, horizontal 4:3, de un patio de venta de autos usados en Costa Rica a pleno día: piso de concreto, fondo con vegetación tropical y cielo parcialmente nublado. Sin personas, sin texto, sin logotipos visibles y con la placa tapada o fuera de cuadro. Iluminación natural, colores fieles, aspecto de foto tomada con celular de buena calidad.

Para repuestos el estilo cambia a:

> Fotografía realista, horizontal 4:3, de una pieza de auto usada sobre una mesa de taller de metal, fondo neutro gris desenfocado, luz natural de ventana. Sin personas, sin texto, sin logotipos visibles.

## Autos

| Archivo | Prompt |
|---|---|
| auto-01 | Sedán compacto blanco tipo Toyota Corolla 2018, vista frontal ¾ |
| auto-02 | El mismo tipo de sedán blanco, vista trasera ¾ |
| auto-03 | Interior de sedán: tablero, volante y pantalla táctil, asientos de tela negra |
| auto-04 | SUV mediano gris oscuro tipo Toyota RAV4 2020, vista frontal ¾ |
| auto-05 | Pickup doble cabina plateado tipo Toyota Hilux 2019, vista lateral ¾ con el cajón |
| auto-06 | Hatchback rojo pequeño tipo Suzuki Swift 2017, vista frontal ¾ |
| auto-07 | Interior de SUV con asientos de cuero beige y techo panorámico |
| auto-08 | Crossover eléctrico azul tipo Hyundai Kona 2021, vista frontal ¾ |
| auto-09 | Sedán gris plateado tipo Nissan Sentra 2016, vista lateral |
| auto-10 | SUV blanco de 7 pasajeros tipo Mitsubishi Montero Sport 2019, vista frontal ¾ |
| auto-11 | Pickup blanco de trabajo tipo Isuzu D-Max 2018 con rack, vista trasera ¾ |
| auto-12 | Hatchback eléctrico blanco tipo Nissan Leaf 2019, vista lateral ¾ |
| auto-13 | Motor a la vista con el capó abierto de un sedán, limpio y en buen estado |
| auto-14 | SUV compacto negro tipo Kia Sportage 2018, vista frontal ¾ |
| auto-15 | Sedán azul oscuro tipo Mazda 3 2019, vista trasera ¾ |
| auto-16 | Interior de pickup: tablero, palanca de cambios manual y asientos de tela gris |
| auto-17 | SUV pequeño verde tipo Suzuki Jimny 2021, vista frontal ¾ |
| auto-18 | Camión liviano blanco tipo Isuzu NPR con cajón cerrado, vista lateral |
| auto-19 | Hatchback plateado tipo Honda Fit 2015, vista frontal ¾ |
| auto-20 | Crossover eléctrico gris claro tipo BYD Yuan Plus 2023, vista frontal ¾ |
| auto-21 | Pickup rojo tipo Ford Ranger 2020, vista frontal ¾ |
| auto-22 | Tablero digital y pantalla con Apple CarPlay de un auto moderno, primer plano |
| auto-23 | SUV grande blanco perla tipo Ford Explorer 2019, vista trasera ¾ |
| auto-24 | Fila de cuatro autos usados de distintos colores estacionados en el patio, vista general |

## Repuestos

| Archivo | Prompt |
|---|---|
| repuesto-01 | Alternador de auto usado |
| repuesto-02 | Batería de auto de 12 V |
| repuesto-03 | Motor de arranque |
| repuesto-04 | Juego de pastillas de freno delanteras |
| repuesto-05 | Disco de freno delantero ventilado |
| repuesto-06 | Faro delantero de sedán (unidad completa) |
| repuesto-07 | Stop trasero de hatchback |
| repuesto-08 | Amortiguador delantero con su resorte |
| repuesto-09 | Radiador de aluminio |
| repuesto-10 | Bomba de agua |
| repuesto-11 | Espejo retrovisor lateral con carcasa negra |
| repuesto-12 | Aro de lujo de aluminio de 16 pulgadas, sin llanta |
| repuesto-13 | Caja de cambios manual |
| repuesto-14 | Tapicería de asiento delantero en tela gris |
| repuesto-15 | Culata de motor de 4 cilindros |
| repuesto-16 | Varias piezas pequeñas ordenadas: bujías, filtros y sensores |
