import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { revalidateTag } from "next/cache";

import { POST } from "./route";

function pedido(cuerpo: unknown, token?: string): Request {
  return new Request("http://localhost:3000/api/revalidar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
    },
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
}

describe("POST /api/revalidar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("REVALIDACION_SECRETO", "secreto-de-prueba");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sin token o con un token equivocado responde 401 y no revalida", async () => {
    expect((await POST(pedido({ etiquetas: ["articulos"] }))).status).toBe(401);
    expect(await POST(pedido({ etiquetas: ["articulos"] }, "otro"))).toHaveProperty("status", 401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("si el secreto no está configurado responde 503", async () => {
    vi.stubEnv("REVALIDACION_SECRETO", "");
    expect((await POST(pedido({ etiquetas: ["articulos"] }, ""))).status).toBe(503);
  });

  it.each([
    ["JSON roto", "{no es json"],
    ["sin etiquetas", {}],
    ["lista vacía", { etiquetas: [] }],
    ["etiqueta con caracteres raros", { etiquetas: ["Artículos!"] }],
    ["demasiadas etiquetas", { etiquetas: Array.from({ length: 51 }, (_, i) => `a-${i}`) }],
  ])("cuerpo inválido (%s) → 400", async (_, cuerpo) => {
    expect((await POST(pedido(cuerpo, "secreto-de-prueba"))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalida cada etiqueta de inmediato", async () => {
    const respuesta = await POST(
      pedido({ etiquetas: ["articulos", "articulo-12"] }, "secreto-de-prueba"),
    );
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ revalidadas: 2 });
    expect(revalidateTag).toHaveBeenCalledWith("articulos", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("articulo-12", { expire: 0 });
  });
});
