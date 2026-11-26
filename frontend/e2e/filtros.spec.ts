import { expect, test } from "@playwright/test";
import type { Catalogos } from "../src/shared/api/tipos";

/** #124: solo lectura, en los seis anchos acordados para la web pública. */
test("filtros avanzados y compatibilidad en seis anchos", async ({ page, request }, info) => {
  test.setTimeout(180_000);
  const respuesta = await request.get("/api/v1/catalogos/");
  expect(respuesta.ok()).toBeTruthy();
  const catalogos: Catalogos = await respuesta.json();
  const marca = catalogos.marcas.find((m) => m.modelos.length)!;
  const modelo = marca.modelos[0];
  for (const ancho of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    await page.goto("/autos");
    if (ancho < 1024) await page.getByRole("button", { name: "Filtros", exact: true }).click();
    const formulario =
      ancho < 1024
        ? page.getByRole("dialog").getByRole("form", { name: "Filtros" })
        : page
            .getByRole("complementary", { name: "Filtros" })
            .getByRole("form", { name: "Filtros" });
    const avanzados = formulario.locator("details");
    await expect(avanzados).not.toHaveAttribute("open");
    await formulario.getByText("Más filtros", { exact: true }).click();
    await expect(formulario.getByLabel("Kilometraje máximo")).toBeVisible();
    await formulario.getByLabel("Solo ofertas").check();
    await formulario.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page).toHaveURL(/ofertas=1/);
    if (ancho < 1024) await page.getByRole("button", { name: "Filtros (1)", exact: true }).click();
    await expect(formulario.locator("details")).toHaveAttribute("open");
    await formulario.getByText("Más filtros", { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`autos-${ancho}.png`), animations: "disabled" });
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", ancho);
    if (ancho < 1024) await page.getByRole("button", { name: "Cerrar filtros" }).click();

    await page.goto(
      `/repuestos?compatible_marca=${marca.id}&compatible_modelo=${modelo.id}&compatible_anio=2020&categoria=frenos&orden=precio_asc`,
    );
    const nombre = modelo.nombre_vehiculo;
    await expect(
      page.getByText(`Mostrando repuestos compatibles con ${nombre} 2020`, { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`repuestos-${ancho}.png`),
      animations: "disabled",
    });
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", ancho);
    if (ancho < 1024) await page.getByRole("button", { name: /^Filtros \(/ }).click();
    const filtrosRepuesto =
      ancho < 1024
        ? page.getByRole("dialog").getByRole("form", { name: "Filtros" })
        : page
            .getByRole("complementary", { name: "Filtros" })
            .getByRole("form", { name: "Filtros" });
    const campos = await filtrosRepuesto
      .locator("select, input:not([type=hidden])")
      .evaluateAll((elementos) => elementos.map((e) => e.getAttribute("name")));
    await page.screenshot({
      path: info.outputPath(`filtros-repuestos-${ancho}.png`),
      animations: "disabled",
    });
    expect(campos.slice(0, 3)).toEqual([
      "compatible_marca",
      "compatible_modelo",
      "compatible_anio",
    ]);
    if (ancho < 1024) await page.getByRole("button", { name: "Cerrar filtros" }).click();
    await page.getByRole("link", { name: "Quitar vehículo", exact: true }).click();
    await expect(page).toHaveURL(/\/repuestos\?categoria=frenos&orden=precio_asc$/);
    await expect(page.getByText(/^Mostrando repuestos compatibles/)).toHaveCount(0);
  }
});
