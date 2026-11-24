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
  if (!respuesta.ok) throw new ErrorApi(respuesta.status);
  return (await respuesta.json()) as T;
}
