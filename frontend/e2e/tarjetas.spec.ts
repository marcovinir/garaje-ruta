import { expect, test } from "@playwright/test";

for (const seccion of ["autos", "repuestos"]) {
  test(`tarjetas de ${seccion} en seis anchos`, async ({ page }, info) => {
    test.skip(info.project.name !== "escritorio", "Un recorrido por todos los anchos");
    await page.goto(`/${seccion}`);
    const tarjetas = page
      .locator(`main a[href^="/${seccion}/"]`)
      .filter({ hasText: "Ver detalles" });
    await expect(tarjetas.first()).toBeVisible();
    for (const width of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator("html")).toHaveJSProperty("scrollWidth", width);
      await expect(tarjetas.first().getByText("Ver detalles")).toBeVisible();
      await expect(tarjetas.first().getByRole("heading")).toBeVisible();
      expect(await tarjetas.first().locator("button, a").count()).toBe(0);
      const foto = await tarjetas.first().locator("img").boundingBox();
      expect(foto).not.toBeNull();
      expect(foto!.width / foto!.height).toBeCloseTo(4 / 3, 1);
      const posicion = await tarjetas.evaluateAll((enlaces) =>
        enlaces.slice(0, 6).map((enlace) => ({
          fila: Math.round(enlace.getBoundingClientRect().top),
          pie: Math.round(
            enlace.lastElementChild!.lastElementChild!.getBoundingClientRect().bottom,
          ),
        })),
      );
      for (const tarjeta of posicion) {
        expect(
          posicion
            .filter((otra) => otra.fila === tarjeta.fila)
            .every((otra) => otra.pie === tarjeta.pie),
        ).toBeTruthy();
      }
    }
  });
}
