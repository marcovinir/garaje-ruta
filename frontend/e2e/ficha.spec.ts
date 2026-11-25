import { expect, test } from "@playwright/test";

import { autosDisponibles } from "./ayudas";

/** HU-02 y HU-03: la ficha trae Open Graph y lleva a WhatsApp con el enlace. Solo lee datos. */
test("la ficha tiene Open Graph, canónica y botón de WhatsApp", async ({ page, request }) => {
  const [auto] = await autosDisponibles(request);

  const html = await (await request.get(auto.ruta)).text();
  expect(html).toMatch(/<meta property="og:title" content="[^"]+"/);
  expect(html).toMatch(/<meta property="og:description" content="₡[^"]+"/);
  expect(html).toMatch(new RegExp(`<link rel="canonical" href="[^"]*${auto.ruta}"`));
  // En el <head> también para un navegador común (sin streaming de metadatos): lo que leen
  // Lighthouse y los rastreadores que no conoce Next.
  const cabecera = html.slice(0, html.indexOf("<body"));
  expect(cabecera).toContain('name="description"');
  expect(cabecera).toContain('property="og:title"');

  await page.goto(auto.ruta);
  await expect(page.getByRole("heading", { level: 1, name: auto.titulo })).toBeVisible();
  const whatsapp = page.getByRole("link", { name: /Consultar/ }).first();
  const href = (await whatsapp.getAttribute("href")) ?? "";
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  expect(decodeURIComponent(href)).toContain(auto.titulo);
  expect(decodeURIComponent(href)).toContain(auto.ruta);
});

test("una URL con el texto viejo redirige con 308 a la canónica", async ({ request }) => {
  const [auto] = await autosDisponibles(request);
  const id = auto.ruta.split("-").pop();
  const vieja = await request.get(`/autos/texto-viejo-${id}`, { maxRedirects: 0 });
  expect(vieja.status()).toBe(308);
  expect(vieja.headers()["location"]).toContain(auto.ruta);
  expect((await request.get("/autos/no-existe-999999", { maxRedirects: 0 })).status()).toBe(404);
});
