import { type APIRequestContext, type Page, expect } from "@playwright/test";

/** Usuarios de `sembrar` con la clave local (solo en desarrollo y CI, nunca en producción). */
const CLAVE_LOCAL = process.env.E2E_CLAVE ?? "Local-Garaje-2026";
export const RUTA_PANEL = process.env.E2E_PANEL_RUTA ?? "/panel";

export async function entrar(page: Page, rol: "admin" | "colaborador" = "admin") {
  await page.goto(`${RUTA_PANEL}/login`);
  await page.getByLabel("Correo").fill(`${rol}@garajeruta.test`);
  await page.getByLabel("Contraseña").fill(CLAVE_LOCAL);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: "Artículos", level: 1 })).toBeVisible();
}

let subidas = 0;

/**
 * En CI Django usa el almacén en memoria (firma de la nube «pruebas»): la subida a Cloudinary
 * se simula y devuelve un public_id propio, como haría Cloudinary.
 */
export async function simularCloudinary(page: Page) {
  await page.route("https://api.cloudinary.com/**", (ruta) =>
    ruta.fulfill({
      json: {
        public_id: `garaje-ruta/articulos/e2e-${Date.now()}-${++subidas}`,
        width: 1600,
        height: 1200,
      },
    }),
  );
}

/** Una foto chica de verdad (PNG 2×2) para el selector de archivos. */
export function fotoDePrueba(nombre: string) {
  return {
    name: nombre,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEklEQVR4nGM4IadxQk6DAUIBACAWBDm/DJE9AAAAAElFTkSuQmCC",
      "base64",
    ),
  };
}

export type ArticuloApi = { id: number; titulo: string; ruta: string };

/** Autos disponibles según la API pública (por el rewrite de Next). */
export async function autosDisponibles(request: APIRequestContext): Promise<ArticuloApi[]> {
  const respuesta = await request.get("/api/v1/articulos/?tipo=auto&tamano=10");
  expect(respuesta.ok()).toBeTruthy();
  return (await respuesta.json()).results;
}
