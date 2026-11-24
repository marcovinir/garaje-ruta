/** Servidor MSW para las pruebas del panel: la API de Django con datos de `datos.ts`. */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

import { CATALOGOS, FILAS, type Rol, TIPO_CAMBIO, yoDe } from "./datos";

export const sesion: { rol: Rol | null } = { rol: "admin" };

const noAutenticado = () =>
  HttpResponse.json(
    { detalle: "Las credenciales de autenticación no se proveyeron." },
    { status: 403 },
  );

export const manejadoresBase = [
  http.get("*/api/v1/auth/csrf/", () => {
    document.cookie = "csrftoken=prueba; path=/";
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/api/v1/auth/yo/", () =>
    sesion.rol ? HttpResponse.json(yoDe(sesion.rol)) : noAutenticado(),
  ),
  http.post("*/api/v1/auth/logout/", () => {
    sesion.rol = null;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/api/v1/catalogos/", () => HttpResponse.json(CATALOGOS)),
  http.get("*/api/v1/tipo-cambio/", () => HttpResponse.json(TIPO_CAMBIO)),
  http.get("*/api/v1/panel/articulos/", () =>
    HttpResponse.json({ count: FILAS.length, next: null, previous: null, results: FILAS }),
  ),
];

export const servidor = setupServer(...manejadoresBase);

/** Para usar en un archivo de pruebas del panel: levanta MSW y reinicia la sesión. */
export function prepararServidor() {
  beforeAll(() => servidor.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    servidor.resetHandlers();
    sesion.rol = "admin";
  });
  afterAll(() => servidor.close());
}
