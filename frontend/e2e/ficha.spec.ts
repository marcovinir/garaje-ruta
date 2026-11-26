import { expect, test } from "@playwright/test";

import type { FichaCompleta } from "../src/shared/api/tipos";
import { colones } from "../src/shared/lib/dinero";

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
  const whatsapp = page.getByRole("link", { name: "Consultar por WhatsApp", exact: true });
  const href = (await whatsapp.getAttribute("href")) ?? "";
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  const respuesta = await request.get(`/api/v1/articulos/${auto.id}/`);
  expect(respuesta.ok()).toBeTruthy();
  const ficha: FichaCompleta = await respuesta.json();
  const datos = ficha.auto!;
  const modelo = datos.modelo.startsWith(datos.marca + " ")
    ? datos.modelo
    : `${datos.marca} ${datos.modelo}`;
  const mensaje = new URL(href).searchParams.get("text");
  expect(mensaje).toBe(
    `Hola, estoy interesado en el ${modelo} ${datos.anio} publicado en ${colones(ficha.precio_colones)}. ¿Todavía está disponible?\n${new URL(auto.ruta, page.url()).href}`,
  );
  const visita = page.getByRole("link", { name: "Agendar una visita", exact: true });
  await expect(visita).toBeVisible();
  const enlaceVisita = new URL((await visita.getAttribute("href")) ?? "");
  expect(enlaceVisita.host).toBe("wa.me");
  expect(enlaceVisita.pathname).toBe(new URL(href).pathname);
  expect(enlaceVisita.searchParams.get("text")).toBe(
    `Hola, me gustaría coordinar una visita para conocer el ${modelo} ${datos.anio}.\n${new URL(auto.ruta, page.url()).href}`,
  );
});

test("una URL con el texto viejo redirige con 308 a la canónica", async ({ request }) => {
  const [auto] = await autosDisponibles(request);
  const id = auto.ruta.split("-").pop();
  const vieja = await request.get(`/autos/texto-viejo-${id}`, { maxRedirects: 0 });
  expect(vieja.status()).toBe(308);
  expect(vieja.headers()["location"]).toContain(auto.ruta);
  expect((await request.get("/autos/no-existe-999999", { maxRedirects: 0 })).status()).toBe(404);
});

test("ficha de auto sin desbordamiento en los seis anchos", async ({ page, request }, info) => {
  test.skip(info.project.name !== "escritorio", "Este caso recorre todos los anchos");
  const [auto] = await autosDisponibles(request);
  await page.goto(auto.ruta);
  const galeria = page.locator("main").getByAltText(auto.titulo).first();
  const bloque = page.getByRole("complementary", { name: "Precio y contacto" });
  await expect(bloque).toBeVisible();
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", width);
    const consulta = page.getByRole("link", { name: "Consultar", exact: true });
    if (width < 1024) await expect(consulta).toBeVisible();
    else await expect(consulta).toBeHidden();
    const foto = await galeria.boundingBox();
    const comercial = await bloque.boundingBox();
    expect(foto).not.toBeNull();
    expect(comercial).not.toBeNull();
    if (width < 1024) expect(comercial!.y).toBeGreaterThan(foto!.y);
    else expect(comercial!.x).toBeGreaterThan(foto!.x);
  }
});
