/**
 * Cliente de la API para el navegador (panel): rutas relativas a /api/v1 (el rewrite de Next
 * las lleva a Django en el mismo origen, con la cookie de sesión), CSRF de Django y errores
 * uniformes. Adaptado del de Sonrisa Viva.
 */

export class ApiError extends Error {
  status: number;
  detalle: string;
  campos: Record<string, unknown>;

  constructor(status: number, detalle: string, campos: Record<string, unknown> = {}) {
    super(detalle);
    this.name = "ApiError";
    this.status = status;
    this.detalle = detalle;
    this.campos = campos;
  }
}

export const SIN_CONEXION =
  "No pudimos conectar con el garaje. Revisá tu conexión e intentá de nuevo.";

export type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type OpcionesApi = {
  metodo?: Metodo;
  cuerpo?: unknown;
  query?: Record<string, string | number | undefined | null>;
};

const BASE = "/api/v1";

function armarUrl(ruta: string, query?: OpcionesApi["query"]): string {
  const url = new URL(BASE + ruta, window.location.origin);
  for (const [clave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== null && valor !== "") {
      url.searchParams.set(clave, String(valor));
    }
  }
  return url.toString();
}

function leerCookie(nombre: string): string | null {
  const par = document.cookie.split("; ").find((c) => c.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

async function asegurarCsrf(): Promise<string | null> {
  if (!leerCookie("csrftoken")) {
    await fetch(armarUrl("/auth/csrf/"), { credentials: "same-origin" });
  }
  return leerCookie("csrftoken");
}

async function aError(respuesta: Response): Promise<ApiError> {
  try {
    const datos = await respuesta.json();
    return new ApiError(
      respuesta.status,
      datos.detalle ?? "Algo salió mal. Intentá de nuevo.",
      datos.campos ?? {},
    );
  } catch {
    return new ApiError(respuesta.status, "Algo salió mal. Intentá de nuevo.");
  }
}

export async function api<T = unknown>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  const metodo = opciones.metodo ?? "GET";
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  let respuesta: Response;
  try {
    if (metodo !== "GET") {
      const token = await asegurarCsrf();
      if (token) cabeceras["X-CSRFToken"] = token;
    }
    if (opciones.cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
    respuesta = await fetch(armarUrl(ruta, opciones.query), {
      method: metodo,
      headers: cabeceras,
      credentials: "same-origin",
      body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(0, SIN_CONEXION);
  }
  if (!respuesta.ok) throw await aError(respuesta);
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

/**
 * Errores de DRF a `{ "auto.anio": ["…"] }` para `setError` de React Hook Form. DRF anida los
 * errores de serializadores internos (`auto`) y de listas (`compatibilidades`, una entrada por
 * fila, `{}` si esa fila está bien).
 */
export function camposPlanos(campos: unknown, prefijo = ""): Record<string, string[]> {
  if (Array.isArray(campos) && campos.every((c) => typeof c === "string")) {
    return prefijo ? { [prefijo]: campos as string[] } : {};
  }
  const entradas: [string, unknown][] = Array.isArray(campos)
    ? campos.map((v, i) => [String(i), v])
    : campos && typeof campos === "object"
      ? Object.entries(campos)
      : [];
  return Object.assign(
    {},
    ...entradas.map(([clave, valor]) =>
      camposPlanos(valor, prefijo ? `${prefijo}.${clave}` : clave),
    ),
  );
}
