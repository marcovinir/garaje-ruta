import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decidirFicha } from "./decidirFicha";

const responder = (status: number, cuerpo?: unknown) =>
  vi
    .fn()
    .mockImplementation(
      async () => new Response(cuerpo === undefined ? "" : JSON.stringify(cuerpo), { status }),
    );

describe("decidirFicha (proxy de la ficha)", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_URL", "http://api.test");
    vi.stubEnv("SERVIDOR_NEXT_SECRETO", "s3cr3t");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("la URL canónica sigue de largo y se identifica ante Django", async () => {
    const falso = responder(200, { id: 12, tipo: "auto", ruta: "/autos/corolla-2015-12" });
    vi.stubGlobal("fetch", falso);
    expect(await decidirFicha("/autos/corolla-2015-12")).toEqual({ tipo: "seguir" });
    const [url, init] = falso.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/articulos/12/");
    expect(new Headers(init.headers).get("X-Servidor-Next")).toBe("s3cr3t");
  });

  it("un texto viejo o la sección equivocada → 308 a la canónica", async () => {
    vi.stubGlobal(
      "fetch",
      responder(200, { id: 12, tipo: "auto", ruta: "/autos/corolla-2015-se-12" }),
    );
    expect(await decidirFicha("/autos/corolla-2015-12")).toEqual({
      tipo: "redirigir",
      ruta: "/autos/corolla-2015-se-12",
    });
    expect(await decidirFicha("/repuestos/corolla-2015-se-12")).toEqual({
      tipo: "redirigir",
      ruta: "/autos/corolla-2015-se-12",
    });
  });

  it("un id que no existe, o una URL sin id → 404", async () => {
    vi.stubGlobal("fetch", responder(404));
    expect(await decidirFicha("/autos/algo-999")).toEqual({ tipo: "no-existe" });
    expect(await decidirFicha("/autos/sin-numero")).toEqual({ tipo: "no-existe" });
  });

  it("un artículo oculto (sin ruta) en la otra sección → 404; en la suya sigue", async () => {
    vi.stubGlobal(
      "fetch",
      responder(200, { id: 5, tipo: "repuesto", estado_publico: "no_disponible" }),
    );
    expect(await decidirFicha("/autos/x-5")).toEqual({ tipo: "no-existe" });
    expect(await decidirFicha("/repuestos/x-5")).toEqual({ tipo: "seguir" });
  });

  it("si Django falla o tarda, deja que la página muestre su mensaje", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(await decidirFicha("/autos/corolla-2015-12")).toEqual({ tipo: "seguir" });
    vi.stubGlobal("fetch", responder(503));
    expect(await decidirFicha("/autos/corolla-2015-12")).toEqual({ tipo: "seguir" });
  });
});
