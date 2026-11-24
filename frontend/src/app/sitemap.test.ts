import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/shared/api/datos", () => ({ obtenerSitemap: vi.fn() }));

import * as datos from "@/shared/api/datos";

import robots from "./robots";
import sitemap from "./sitemap";

describe("sitemap y robots", () => {
  beforeEach(() => vi.stubEnv("SITIO_URL", "https://garaje.example"));
  afterEach(() => vi.unstubAllEnvs());

  it("incluye las páginas fijas y los artículos con URL absoluta y fecha", async () => {
    vi.mocked(datos.obtenerSitemap).mockResolvedValue([
      { ruta: "/autos/kia-rio-2018-3", actualizado_en: "2026-11-20T10:00:00-06:00" },
    ]);
    const entradas = await sitemap();
    expect(entradas.map((e) => e.url)).toEqual([
      "https://garaje.example/",
      "https://garaje.example/autos",
      "https://garaje.example/repuestos",
      "https://garaje.example/autos/kia-rio-2018-3",
    ]);
    expect(entradas[3].lastModified).toEqual(new Date("2026-11-20T10:00:00-06:00"));
  });

  it("si Django falla, el sitemap trae al menos las páginas fijas", async () => {
    vi.mocked(datos.obtenerSitemap).mockRejectedValue(new Error("caído"));
    expect(await sitemap()).toHaveLength(3);
  });

  it("robots permite todo salvo la API y enlaza el sitemap", () => {
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
      sitemap: "https://garaje.example/sitemap.xml",
    });
  });
});
