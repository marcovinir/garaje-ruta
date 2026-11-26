import { expect, test } from "@playwright/test";

import type { Configuracion } from "../src/shared/api/tipos";

test("contacto desde el pie, datos del negocio y seis anchos", async ({ page, request }, info) => {
  test.skip(info.project.name !== "escritorio", "Un recorrido por todos los anchos");
  const res = await request.get("/api/v1/configuracion/");
  expect(res.ok()).toBeTruthy();
  const configuracion: Configuracion = await res.json();
  await page.goto("/");
  const pie = page.getByRole("contentinfo");
  await expect(pie).toHaveAttribute("id", "contacto");
  await pie.getByRole("link", { name: "Contacto y confianza" }).click();
  await expect(page).toHaveURL(/\/contacto$/);
  const contenido = page.getByRole("main");
  await expect(
    contenido.getByRole("heading", { level: 1, name: "Contacto y confianza" }),
  ).toBeVisible();
  await expect(contenido.getByText(/Negocio ficticio de portafolio/)).toBeVisible();
  if (configuracion.horarios.length > 0) {
    await expect(contenido.getByRole("heading", { name: "Horario" })).toBeVisible();
  }
  const whatsapp = contenido.getByRole("link", { name: "Escribinos por WhatsApp" });
  if (configuracion.whatsapp) await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\//);

  const resumen = contenido.locator("summary").first();
  if (configuracion.preguntas_frecuentes?.length) {
    await resumen.focus();
    await page.keyboard.press("Enter");
    await expect(resumen.locator("..")).toHaveAttribute("open");
    await page.keyboard.press("Space");
    await expect(resumen.locator("..")).not.toHaveAttribute("open");
  } else {
    await expect(contenido.getByRole("heading", { name: "Preguntas frecuentes" })).toHaveCount(0);
  }
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", width);
  }
});
