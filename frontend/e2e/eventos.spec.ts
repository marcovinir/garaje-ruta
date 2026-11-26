import { expect, test } from "@playwright/test";

test("registra la impresión de ofertas y la búsqueda sin enviar su texto", async ({ page }) => {
  const eventoOfertas = page.waitForResponse(
    (res) =>
      new URL(res.url()).pathname === "/api/v1/eventos/" &&
      res.request().postDataJSON()?.tipo === "offer_view",
  );
  await page.goto("/");
  const ofertas = page.getByRole("region", { name: "Ofertas", exact: true });
  await expect(ofertas).toBeVisible();
  await ofertas.getByRole("heading", { name: "Ofertas" }).scrollIntoViewIfNeeded();
  const impresion = await eventoOfertas;
  expect(impresion.status()).toBe(204);
  expect(impresion.request().postDataJSON().contexto).toEqual({
    pagina: "inicio",
    seccion: "ofertas",
  });

  const buscador = page.getByRole("banner").getByRole("search");
  const busqueda = page.waitForResponse(
    (res) =>
      new URL(res.url()).pathname === "/api/v1/eventos/" &&
      res.request().postDataJSON()?.tipo === "search_submitted",
  );
  await buscador.getByRole("combobox").fill("Corolla");
  await buscador.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/\/buscar\?q=Corolla$/);
  const envio = await busqueda;
  expect(envio.status()).toBe(204);
  expect(envio.request().postDataJSON()).toEqual({
    tipo: "search_submitted",
    contexto: { pagina: "inicio", seccion: "encabezado" },
    dispositivo: expect.stringMatching(/^(celular|escritorio)$/),
  });
});
