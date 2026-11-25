import { describe, expect, it } from "vitest";

import { cabecerasSeguridad } from "./cabeceras";

describe("cabeceras de seguridad", () => {
  it("ninguna página se puede incrustar en otro sitio (clickjacking) y van en todas las rutas", () => {
    const [regla] = cabecerasSeguridad();
    expect(regla.source).toBe("/:path*");
    const valores = Object.fromEntries(regla.headers.map((h) => [h.key, h.value]));
    expect(valores["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
    expect(valores["X-Frame-Options"]).toBe("DENY");
    expect(valores["X-Content-Type-Options"]).toBe("nosniff");
    expect(valores["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});
