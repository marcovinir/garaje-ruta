import { expect, test } from "@playwright/test";

test("catálogo público en seis anchos y carga prioritaria solo para la foto principal", async ({
  page,
  request,
}, info) => {
  test.skip(info.project.name !== "escritorio", "Se cubren los seis anchos en Chromium.");
  const [autos, repuestos] = await Promise.all(
    ["auto", "repuesto"].map(async (tipo) => {
      const res = await request.get("/api/v1/articulos/", { params: { tipo, tamano: 1 } });
      expect(res.ok()).toBeTruthy();
      return (await res.json()).results as { ruta: string }[];
    }),
  );
  const rutas = [
    "/",
    "/autos",
    "/repuestos",
    "/buscar?q=Toyota",
    autos[0].ruta,
    repuestos[0].ruta,
    "/contacto",
  ];
  const errores: string[] = [];
  page.on("pageerror", (error) => errores.push(error.message));
  await page.addInitScript(() => {
    let puntuacion = 0;
    Object.defineProperty(window, "__cls", { get: () => puntuacion });
    new PerformanceObserver((lista) => {
      for (const entrada of lista.getEntries()) {
        const salto = entrada as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!salto.hadRecentInput) puntuacion += salto.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const ruta of rutas) {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(ruta);
    const contenido = page.getByRole("main");
    await expect(contenido.getByRole("heading", { level: 1 })).toBeVisible();
    if (ruta !== "/contacto") {
      await expect(contenido.locator("img[fetchpriority=high]")).toHaveCount(1);
      await expect(contenido.locator("img[fetchpriority=high]")).toHaveAttribute(
        "loading",
        "eager",
      );
      await expect(contenido.locator("img:not([loading=lazy])")).toHaveCount(1);
      if (ruta.startsWith("/autos/") || ruta.startsWith("/repuestos/")) {
        const foto = contenido.locator("img[fetchpriority=high]");
        await expect(foto).toHaveAttribute("alt", /\S/);
        await expect(foto).toBeVisible();
        const rutaFicha = contenido.getByRole("navigation", { name: "Ruta de navegación" });
        for (const enlace of await rutaFicha.getByRole("link").all()) {
          const caja = await enlace.boundingBox();
          expect(caja?.height).toBeGreaterThanOrEqual(44);
          expect(caja?.width).toBeGreaterThanOrEqual(44);
        }
        await expect(
          contenido.locator(".barra-fija").getByRole("link", { name: "Consultar" }),
        ).toBeVisible();
      }
    }
    for (const ancho of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width: ancho, height: 780 });
      await expect(page.locator("html"), ruta).toHaveJSProperty("scrollWidth", ancho);
      const altoBuscar = await page
        .getByRole("banner")
        .getByRole("button", { name: "Buscar" })
        .evaluate((boton) => boton.getBoundingClientRect().height);
      expect(altoBuscar, ruta).toBeGreaterThanOrEqual(44);
      const whatsapp = page.locator("[data-origen-whatsapp=flotante]");
      // Pedido de Marco (#115): botón fijo abajo a la derecha en todas las páginas públicas
      // (salvo donde se oculta a propósito: ficha en el celular, menú o sugerencias abiertas).
      if (await whatsapp.isVisible()) {
        await expect(whatsapp).toHaveCSS("position", "fixed");
        const caja = await whatsapp.boundingBox();
        const ventana = page.viewportSize();
        expect(caja && ventana && caja.y + caja.height <= ventana.height, ruta).toBeTruthy();
      }
    }
    expect(await page.evaluate(() => Reflect.get(window, "__cls")), ruta).toBeLessThan(0.1);
  }
  expect(errores).toEqual([]);
});

test("menú horizontal, buscador accesible y estado 404", async ({ page }, info) => {
  test.skip(info.project.name !== "escritorio", "Recorrido con tamaño fijo y teclado.");
  await page.setViewportSize({ width: 780, height: 280 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  const salto = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(salto).toBeFocused();
  await expect(salto).toHaveCSS("outline-style", "solid");
  const encabezado = page.getByRole("banner");
  const menu = encabezado.getByRole("button", { name: "Abrir el menú" });
  await page.keyboard.press("Tab");
  await expect(menu).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(encabezado.getByRole("navigation", { name: "Menú" })).toBeVisible();
  expect((await encabezado.boundingBox())!.height).toBeLessThan(280);
  await expect(page.locator("[data-origen-whatsapp=flotante]")).toBeHidden();
  const campo = encabezado.getByRole("combobox");
  await campo.fill("Toyota");
  const lista = encabezado.getByRole("listbox");
  await expect(lista).toBeVisible();
  const caja = await lista.locator("..").boundingBox();
  expect(caja!.y + caja!.height).toBeLessThanOrEqual(280);
  await campo.press("ArrowDown");
  await expect(campo).toHaveAttribute("aria-activedescendant", /opcion-0$/);
  await campo.press("Escape");
  await expect(encabezado.getByRole("listbox")).toBeHidden();
  await campo.press("Escape");
  await expect(encabezado.getByRole("button", { name: "Abrir el menú" })).toBeFocused();

  await page.setViewportSize({ width: 1440, height: 900 });
  const respuesta = await page.goto("/autos/auto-inexistente-99999999");
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
