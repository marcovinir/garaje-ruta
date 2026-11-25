import { expect, test } from "@playwright/test";

import { RUTA_PANEL, autosDisponibles, entrar } from "./ayudas";

/** HU-04: al marcar un auto como vendido sale de la web en menos de un minuto; deshacer lo devuelve. */
test("vender un auto lo saca de la web y deshacer lo devuelve", async ({ page, request }, info) => {
  // Un auto distinto por proyecto, para no pisarse entre celular y escritorio.
  const autos = await autosDisponibles(request);
  const auto = autos[info.project.name === "celular" ? 1 : 2];

  await entrar(page);
  await page.goto(`${RUTA_PANEL}/articulos?q=${encodeURIComponent(auto.titulo)}`);
  await page.getByRole("button", { name: "Vendido", exact: true }).first().click();
  await expect(page.getByText(`Vendido: ${auto.titulo}`)).toBeVisible();

  await expect(async () => {
    await page.goto(auto.ruta);
    await expect(page.getByRole("heading", { name: "Este auto ya se vendió" })).toBeVisible();
  }).toPass({ timeout: 60_000 });

  await page.goto(`${RUTA_PANEL}/articulos?q=${encodeURIComponent(auto.titulo)}`);
  await page.getByRole("button", { name: "Más acciones" }).first().click();
  await page.getByRole("button", { name: "Deshacer venta" }).click();
  await expect(page.getByText("Venta deshecha.")).toBeVisible();

  await expect(async () => {
    await page.goto(auto.ruta);
    await expect(page.getByRole("heading", { level: 1, name: auto.titulo })).toBeVisible();
  }).toPass({ timeout: 60_000 });
});
