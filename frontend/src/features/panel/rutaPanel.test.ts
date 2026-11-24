import { afterEach, describe, expect, it, vi } from "vitest";

import { baseDelPanel, decidirPanel, rutaPanel } from "./rutaPanel";

describe("rutaPanel", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("usa /panel por defecto", () => {
    vi.stubEnv("NEXT_PUBLIC_PANEL_RUTA", "");
    expect(rutaPanel()).toBe("/panel");
    expect(rutaPanel("articulos")).toBe("/panel/articulos");
  });

  it("usa la ruta configurada y quita barras sobrantes", () => {
    vi.stubEnv("NEXT_PUBLIC_PANEL_RUTA", "/gestion-9x2/");
    expect(rutaPanel("/articulos/12")).toBe("/gestion-9x2/articulos/12");
  });

  it("un valor inválido cae a /panel", () => {
    vi.stubEnv("NEXT_PUBLIC_PANEL_RUTA", "gestion con espacios");
    expect(baseDelPanel()).toBe("/panel");
    vi.stubEnv("NEXT_PUBLIC_PANEL_RUTA", "/autos");
    expect(baseDelPanel()).toBe("/panel");
  });
});

describe("decidirPanel", () => {
  it("reescribe la ruta configurada a /panel", () => {
    expect(decidirPanel("/gestion-9x2", "/gestion-9x2")).toEqual({
      tipo: "reescribir",
      destino: "/panel",
    });
    expect(decidirPanel("/gestion-9x2/articulos", "/gestion-9x2")).toEqual({
      tipo: "reescribir",
      destino: "/panel/articulos",
    });
  });

  it("/panel directo da 404 si la ruta configurada es otra", () => {
    expect(decidirPanel("/panel/articulos", "/gestion-9x2")).toEqual({ tipo: "no-existe" });
    expect(decidirPanel("/panel", "/gestion-9x2")).toEqual({ tipo: "no-existe" });
  });

  it("con /panel configurado, /panel sigue de largo", () => {
    expect(decidirPanel("/panel/articulos", "/panel")).toEqual({ tipo: "seguir" });
  });

  it("no toca otras rutas ni prefijos parecidos", () => {
    expect(decidirPanel("/autos", "/gestion-9x2")).toEqual({ tipo: "seguir" });
    expect(decidirPanel("/gestion-9x2x/a", "/gestion-9x2")).toEqual({ tipo: "seguir" });
    expect(decidirPanel("/panelito", "/gestion-9x2")).toEqual({ tipo: "seguir" });
  });
});
