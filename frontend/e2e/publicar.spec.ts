import { expect, test } from "@playwright/test";

import { RUTA_PANEL, entrar, fotoDePrueba, simularCloudinary } from "./ayudas";

/** HU-01: el admin publica un auto con fotos desde el panel y aparece en la web. */
test("publicar un auto con dos fotos y verlo en /autos", async ({ page }, info) => {
  const titulo = `Auto E2E ${info.project.name} ${Date.now()}`;
  await simularCloudinary(page);
  await entrar(page);
  await page.goto(`${RUTA_PANEL}/articulos/nuevo?tipo=auto`);

  await page.getByLabel("Título", { exact: true }).fill(titulo);
  await page.getByLabel("Precio (₡)", { exact: true }).fill("7500000");
  await page.getByLabel("Marca", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Modelo", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Año", { exact: true }).fill("2019");
  await page.getByLabel("Kilometraje", { exact: true }).fill("54000");
  for (const campo of ["Transmisión", "Combustible", "Tracción", "Carrocería"]) {
    await page.getByLabel(campo, { exact: true }).selectOption({ index: 1 });
  }
  await page.getByLabel("Color exterior", { exact: true }).fill("Gris");

  await page
    .getByLabel("Elegir de la galería", { exact: true })
    .setInputFiles([fotoDePrueba("frente.png"), fotoDePrueba("interior.png")]);
  await expect(page.getByText("2 de 15")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar" })).toBeEnabled({ timeout: 20_000 });
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText(`Guardado: ${titulo}`)).toBeVisible();
  // Django avisa a Next al guardar: la web lo muestra sin esperar la caché.
  const slug = titulo.toLowerCase().replaceAll(" ", "-");
  await expect(async () => {
    await page.goto("/autos");
    const tarjeta = page.locator(`main a[href^="/autos/${slug}-"]`);
    await expect(tarjeta.getByText("Ver detalles")).toBeVisible();
  }).toPass({ timeout: 60_000 });
});
