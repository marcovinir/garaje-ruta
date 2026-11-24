import "server-only";

/** Llamadas de Next (servidor) a Django. Next se identifica para no agotar el límite por IP. */

export class ErrorApi extends Error {
  constructor(public status: number) {
    super(`La API respondió ${status}`);
    this.name = "ErrorApi";
  }
}

function backendUrl(): string {
  return (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");
}

export async function pedir<T>(ruta: string): Promise<T> {
  const datos = await pedirOpcional<T>(ruta);
  if (datos === null) throw new ErrorApi(404);
  return datos;
}

/**
 * Como `pedir`, pero un 404 devuelve `null` en vez de lanzar. Sirve dentro de 'use cache', donde
 * los errores cambian de clase y `instanceof ErrorApi` deja de funcionar.
 */
export async function pedirOpcional<T>(ruta: string): Promise<T | null> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${backendUrl()}${ruta}`, {
      headers: {
        Accept: "application/json",
        "X-Servidor-Next": process.env.SERVIDOR_NEXT_SECRETO ?? "",
      },
    });
  } catch {
    throw new ErrorApi(0);
  }
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new ErrorApi(respuesta.status);
  return (await respuesta.json()) as T;
}
