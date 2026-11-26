import { expect, test } from "@playwright/test";

import type { FichaCompleta, Pagina, Tarjeta } from "../src/shared/api/tipos";
import { colones } from "../src/shared/lib/dinero";

test("ficha de repuesto muestra stock y compatibilidad y ofrece las dos consultas", async ({
  page,
  request,
}, info) => {
  const lista = await request.get("/api/v1/articulos/?tipo=repuesto&tamano=1");
  expect(lista.ok()).toBeTruthy();
  const {
    results: [tarjeta],
  }: Pagina<Tarjeta> = await lista.json();
  expect(tarjeta).toBeDefined();
  const respuesta = await request.get(`/api/v1/articulos/${tarjeta.id}/`);
  expect(respuesta.ok()).toBeTruthy();
  const ficha: FichaCompleta = await respuesta.json();
  const repuesto = ficha.repuesto!;
  expect(repuesto.cantidad).toBeGreaterThan(0);
  expect(repuesto.compatibilidades.length).toBeGreaterThan(0);

  await page.goto(ficha.ruta);
  await expect(page.getByRole("heading", { level: 1, name: ficha.titulo })).toBeVisible();
  const bloque = page.getByRole("complementary", { name: "Precio y contacto" });
  await expect(
    bloque.getByText(
      repuesto.cantidad === 1 ? /Queda 1/ : new RegExp(`Quedan ${repuesto.cantidad}`),
    ),
  ).toBeVisible();
  const tabla = page.getByRole("table", { name: "Compatibilidad" });
  await expect(tabla.getByRole("row")).toHaveCount(repuesto.compatibilidades.length + 1);
  const consulta = bloque.getByRole("link", { name: "Consultar por WhatsApp" });
  const confirmar = bloque.getByRole("link", { name: "Confirmar compatibilidad" });
  const enlaceConsulta = new URL((await consulta.getAttribute("href"))!);
  const enlaceConfirmar = new URL((await confirmar.getAttribute("href"))!);
  expect(enlaceConsulta.host).toBe("wa.me");
  expect(enlaceConfirmar.host).toBe("wa.me");
  expect(enlaceConfirmar.pathname).toBe(enlaceConsulta.pathname);
  const url = new URL(ficha.ruta, page.url()).href;
  expect(enlaceConsulta.searchParams.get("text")).toBe(
    `Hola, estoy interesado en este repuesto: ${ficha.titulo}, publicado en ${colones(ficha.precio_colones)}. Quisiera conocer su disponibilidad.\n${url}`,
  );
  const numeroParte = repuesto.numero_parte.trim();
  expect(enlaceConfirmar.searchParams.get("text")).toBe(
    [
      "Hola, quisiera confirmar si el siguiente repuesto es compatible con mi vehículo:",
      `Repuesto: ${ficha.titulo}`,
      ...(numeroParte ? [`Número de parte: ${numeroParte}`] : []),
      "Marca de mi vehículo:",
      "Modelo:",
      "Año:",
      "Motor:",
      url,
    ].join("\n"),
  );

  if (info.project.name === "escritorio") {
    for (const width of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator("html")).toHaveJSProperty("scrollWidth", width);
      const margen = await tabla.boundingBox();
      expect(margen).not.toBeNull();
      expect(margen!.x + margen!.width).toBeLessThanOrEqual(width);
      const consultaMovil = page.getByRole("link", { name: "Consultar", exact: true });
      if (width < 1024) await expect(consultaMovil).toBeVisible();
      else await expect(consultaMovil).toBeHidden();
    }
  }
});
