import { afterEach, describe, expect, it, vi } from "vitest";

import cargador from "./cargador-imagenes";
import { urlFoto } from "./cloudinary";

describe("urlFoto", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("arma la URL de Cloudinary con ancho", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD", "garaje");
    expect(urlFoto("garaje-ruta/ejemplo/auto-01", { ancho: 800 })).toBe(
      "https://res.cloudinary.com/garaje/image/upload/f_auto,q_auto,w_800/garaje-ruta/ejemplo/auto-01",
    );
  });

  it("recorta para Open Graph", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD", "garaje");
    expect(urlFoto("x/y", { ancho: 1200, alto: 630, recorte: true })).toBe(
      "https://res.cloudinary.com/garaje/image/upload/f_auto,q_auto,w_1200,h_630,c_fill/x/y",
    );
  });

  it("sin nube configurada usa el marcador", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD", "");
    expect(urlFoto("x/y", { ancho: 400 })).toBe("/marca/foto-pendiente.svg");
  });

  it("el cargador de next/image deja pasar rutas locales", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD", "garaje");
    expect(cargador({ src: "/marca/logo-completo.svg", width: 200 })).toBe(
      "/marca/logo-completo.svg",
    );
    expect(cargador({ src: "x/y", width: 640 })).toContain("w_640/x/y");
  });
});
