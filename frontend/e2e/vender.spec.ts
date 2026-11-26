import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

import { RUTA_PANEL, autosDisponibles, entrar } from "./ayudas";

async function comprobarCatalogo(
  page: Page,
  request: APIRequestContext,
  ruta: string,
  disponible: boolean,
) {
  const listado = await page.goto("/autos");
  expect(listado?.ok()).toBeTruthy();
  const tarjeta = page.getByRole("main").locator('a[href="' + ruta + '"]');
  if (disponible) await expect(tarjeta).toBeVisible();
  else await expect(tarjeta).toHaveCount(0);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const ubicaciones = await page.evaluate(
    (xml) => {
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      return [
        ...doc.getElementsByTagNameNS("http://www.sitemaps.org/schemas/sitemap/0.9", "loc"),
      ].map((loc) => new URL(loc.textContent ?? "").pathname);
    },
    await sitemap.text(),
  );
  expect(ubicaciones).toContain("/autos");
  if (disponible) expect(ubicaciones).toContain(ruta);
  else expect(ubicaciones).not.toContain(ruta);
}

/** HU-04: al marcar un auto como vendido sale de la web en menos de un minuto; deshacer lo devuelve. */
test("vender un auto lo saca de la web y deshacer lo devuelve", async ({ page, request }, info) => {
  // Un auto distinto por proyecto, para no pisarse entre celular y escritorio.
  const autos = await autosDisponibles(request);
  const auto = autos[info.project.name === "celular" ? 1 : 2];

  await comprobarCatalogo(page, request, auto.ruta, true);
  await entrar(page);
  await page.goto(`${RUTA_PANEL}/articulos?q=${encodeURIComponent(auto.titulo)}`);
  await page.getByRole("button", { name: "Vendido", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Sí, marcar vendido" }).click();
  await expect(page.getByText(`Vendido: ${auto.titulo}`)).toBeVisible();

  await expect(async () => {
    await page.goto(auto.ruta);
    await expect(page.getByRole("heading", { name: "Este auto ya se vendió" })).toBeVisible();
    await comprobarCatalogo(page, request, auto.ruta, false);
  }).toPass({ timeout: 60_000 });

  await page.goto(`${RUTA_PANEL}/articulos?q=${encodeURIComponent(auto.titulo)}`);
  await page.getByRole("button", { name: "Más acciones" }).first().click();
  await page.getByRole("button", { name: "Deshacer venta" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sí, deshacer venta" }).click();
  await expect(page.getByText("Venta deshecha.")).toBeVisible();

  await expect(async () => {
    await page.goto(auto.ruta);
    await expect(page.getByRole("heading", { level: 1, name: auto.titulo })).toBeVisible();
    await comprobarCatalogo(page, request, auto.ruta, true);
  }).toPass({ timeout: 60_000 });
});
