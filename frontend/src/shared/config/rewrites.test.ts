import { describe, expect, it } from "vitest";

import { reescriturasApi } from "./rewrites";

describe("reescriturasApi", () => {
  it("reenvía /api/v1 al backend sin duplicar la barra final de la URL", () => {
    expect(reescriturasApi("http://api.test/")).toEqual([
      { source: "/api/v1/:ruta*", destination: "http://api.test/api/v1/:ruta*/" },
    ]);
  });

  it("acepta la URL del backend sin barra final", () => {
    expect(reescriturasApi("http://localhost:8000")[0].destination).toBe(
      "http://localhost:8000/api/v1/:ruta*/",
    );
  });
});
