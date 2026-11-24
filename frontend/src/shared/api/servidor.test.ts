import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorApi, pedir } from "./servidor";

describe("pedir", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("llama a Django con el encabezado del servidor de Next", async () => {
    vi.stubEnv("BACKEND_URL", "http://api.test/");
    vi.stubEnv("SERVIDOR_NEXT_SECRETO", "s3cr3t");
    const falso = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", falso);
    await expect(pedir("/api/v1/configuracion/")).resolves.toEqual({ ok: 1 });
    const [url, init] = falso.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/configuracion/");
    expect(new Headers(init.headers).get("X-Servidor-Next")).toBe("s3cr3t");
  });

  it("lanza ErrorApi con el código si Django falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    const error = (await pedir("/api/v1/x/").catch((e: unknown) => e)) as ErrorApi;
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.status).toBe(503);
  });

  it("un fallo de red también es ErrorApi", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const error = (await pedir("/api/v1/x/").catch((e: unknown) => e)) as ErrorApi;
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.status).toBe(0);
  });
});
