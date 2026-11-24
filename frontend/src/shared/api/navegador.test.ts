import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ApiError, SIN_CONEXION, api, camposPlanos } from "./navegador";

const servidor = setupServer();

function borrarCookie() {
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

describe("api (navegador)", () => {
  beforeAll(() => servidor.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    servidor.resetHandlers();
    borrarCookie();
  });
  afterAll(() => servidor.close());

  it("GET con query, sin vacíos", async () => {
    let url = "";
    servidor.use(
      http.get("*/api/v1/panel/articulos/", ({ request }) => {
        url = request.url;
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );
    await api("/panel/articulos/", { query: { tipo: "auto", q: "", page: 2, estado: null } });
    expect(new URL(url).search).toBe("?tipo=auto&page=2");
  });

  it("POST manda el CSRF de la cookie y el cuerpo en JSON", async () => {
    document.cookie = "csrftoken=abc123; path=/";
    let token: string | null = null;
    let cuerpo: unknown;
    servidor.use(
      http.post("*/api/v1/panel/articulos/12/vender/", async ({ request }) => {
        token = request.headers.get("X-CSRFToken");
        cuerpo = await request.json();
        return HttpResponse.json({ venta_id: 1 }, { status: 201 });
      }),
    );
    await expect(
      api("/panel/articulos/12/vender/", { metodo: "POST", cuerpo: { cantidad: 1 } }),
    ).resolves.toEqual({ venta_id: 1 });
    expect(token).toBe("abc123");
    expect(cuerpo).toEqual({ cantidad: 1 });
  });

  it("sin cookie de CSRF la pide antes", async () => {
    let pidio = false;
    servidor.use(
      http.get("*/api/v1/auth/csrf/", () => {
        pidio = true;
        document.cookie = "csrftoken=nuevo; path=/";
        return new HttpResponse(null, { status: 204 });
      }),
      http.post("*/api/v1/auth/logout/", () => new HttpResponse(null, { status: 204 })),
    );
    await expect(api("/auth/logout/", { metodo: "POST" })).resolves.toBeUndefined();
    expect(pidio).toBe(true);
  });

  it("convierte {detalle, campos} en ApiError", async () => {
    servidor.use(
      http.post("*/api/v1/panel/articulos/", () =>
        HttpResponse.json(
          { detalle: "Revisá los datos.", campos: { titulo: ["Requerido."] } },
          { status: 400 },
        ),
      ),
    );
    document.cookie = "csrftoken=x; path=/";
    const error = (await api("/panel/articulos/", { metodo: "POST", cuerpo: {} }).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.detalle).toBe("Revisá los datos.");
    expect(error.campos).toEqual({ titulo: ["Requerido."] });
  });

  it("un fallo de red es ApiError(0) con un mensaje que dice cómo seguir", async () => {
    servidor.use(http.get("*/api/v1/auth/yo/", () => HttpResponse.error()));
    const error = (await api("/auth/yo/").catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(0);
    expect(error.detalle).toBe(SIN_CONEXION);
  });
});

describe("camposPlanos", () => {
  it("aplana los errores anidados de DRF a rutas con punto", () => {
    expect(
      camposPlanos({
        titulo: ["Requerido."],
        auto: { anio: ["Muy viejo."] },
        repuesto: { compatibilidades: [{}, { anio_hasta: ["Menor que desde."] }] },
      }),
    ).toEqual({
      titulo: ["Requerido."],
      "auto.anio": ["Muy viejo."],
      "repuesto.compatibilidades.1.anio_hasta": ["Menor que desde."],
    });
  });
});
