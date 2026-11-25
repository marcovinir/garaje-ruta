import { type Page, expect, test } from "@playwright/test";

import { RUTA_PANEL, autosDisponibles, entrar } from "./ayudas";

/**
 * Capturas del README (`docs/capturas/`), a 360 y 1280 px. No corre en CI: se lanza a mano con
 * `CAPTURAS=1 npx playwright test --grep @capturas --project=escritorio`.
 * - La web, contra producción: `E2E_URL=https://garajeruta.marcovinir.dev … --grep "@capturas web"`.
 * - El panel, contra una build local con datos de `sembrar` (inicia sesión con la clave local):
 *   `E2E_URL=http://localhost:3001 … --grep "@capturas panel"`.
 */
test.skip(!process.env.CAPTURAS, "Solo a mano, con CAPTURAS=1.");

const ANCHOS = [
  { ancho: 360, alto: 780 },
  { ancho: 1280, alto: 800 },
];
const CARPETA = "../docs/capturas";

async function capturar(page: Page, nombre: string, ruta: string, listo: () => Promise<void>) {
  for (const { ancho, alto } of ANCHOS) {
    await page.setViewportSize({ width: ancho, height: alto });
    await page.goto(ruta);
    await listo();
    // Que carguen las fotos visibles antes de la captura.
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `${CARPETA}/${nombre}-${ancho}.jpg`,
      type: "jpeg",
      quality: 82,
    });
  }
}

test("@capturas web: inicio, listado y ficha", async ({ page, request }) => {
  const [, auto] = await autosDisponibles(request);
  await capturar(page, "inicio", "/", () =>
    expect(page.getByRole("heading", { level: 1 })).toBeVisible(),
  );
  await capturar(page, "autos", "/autos", () =>
    expect(page.getByRole("heading", { level: 1 })).toBeVisible(),
  );
  await capturar(page, "ficha", auto.ruta, () =>
    expect(page.getByRole("heading", { level: 1, name: auto.titulo })).toBeVisible(),
  );
});

test("@capturas panel: listado y formulario", async ({ page, request }) => {
  const [auto] = await autosDisponibles(request);
  const id = auto.ruta.split("-").pop();
  await entrar(page);
  await capturar(page, "panel-listado", `${RUTA_PANEL}/articulos?tipo=auto`, () =>
    expect(page.getByRole("heading", { name: "Artículos", level: 1 })).toBeVisible(),
  );
  await capturar(page, "panel-formulario", `${RUTA_PANEL}/articulos/${id}`, () =>
    expect(page.getByLabel("Título", { exact: true })).toHaveValue(auto.titulo),
  );
});
