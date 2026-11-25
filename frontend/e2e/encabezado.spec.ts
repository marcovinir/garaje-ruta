import { expect, test } from "@playwright/test";

/**
 * #115: al bajar, el encabezado se compacta. Con un mismo umbral de ida y vuelta, el ajuste de
 * desplazamiento de Chrome lo hacía oscilar y React cortaba con «Maximum update depth exceeded»
 * (la página mostraba «Algo salió mal»). jsdom no lo detecta: esta prueba baja de a 5 px.
 */
for (const ruta of ["/autos", "/repuestos"]) {
  test(`bajar de a poco en ${ruta} no rompe la página y compacta el encabezado`, async ({
    page,
  }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(ruta);
    const encabezado = page.locator("header").first();
    await expect(encabezado).toBeVisible();
    for (let y = 0; y <= 220; y += 5) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(30);
    }
    await expect(encabezado).toBeVisible();
    await expect(encabezado).toHaveAttribute("data-compacto", "true");
    await expect(page.getByText("Algo salió mal")).toHaveCount(0);
    expect(errores).toEqual([]);
  });
}
