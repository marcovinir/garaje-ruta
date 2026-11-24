import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/publico/ficha/decidirFicha", () => ({
  decidirFicha: vi.fn().mockResolvedValue({ tipo: "seguir" }),
}));

import { decidirFicha } from "@/features/publico/ficha/decidirFicha";

import { proxy } from "./proxy";

const pedir = (ruta: string) => proxy(new NextRequest(`http://localhost:3000${ruta}`));

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_PANEL_RUTA", "/gestion-9x2");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reescribe la ruta del panel a /panel y pide no indexar", async () => {
    const r = await pedir("/gestion-9x2/articulos");
    expect(r.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/panel/articulos");
    expect(r.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("/panel directo responde 404 cuando la ruta es otra", async () => {
    const r = await pedir("/panel/login");
    expect(r.status).toBe(404);
    expect(r.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("con /panel configurado, el panel sigue y lleva noindex", async () => {
    vi.stubEnv("NEXT_PUBLIC_PANEL_RUTA", "/panel");
    const r = await pedir("/panel/login");
    expect(r.status).toBe(200);
    expect(r.headers.get("x-middleware-rewrite")).toBeNull();
    expect(r.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("las fichas siguen pasando por decidirFicha y el resto no", async () => {
    vi.mocked(decidirFicha).mockResolvedValueOnce({ tipo: "redirigir", ruta: "/autos/b-1" });
    const r = await pedir("/autos/a-1");
    expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("http://localhost:3000/autos/b-1");
    await pedir("/autos");
    await pedir("/");
    expect(decidirFicha).toHaveBeenCalledTimes(1);
  });
});
