import { idDeSlug } from "@/shared/lib/rutas";

/**
 * Decide, antes de renderizar, qué responder a `/autos/{slug}` o `/repuestos/{slug}`.
 *
 * Con Cache Components la página empieza a enviarse con 200 antes de saber si el artículo
 * existe, así que el 308 (URL vieja) y el 404 (id inexistente) tienen que salir de `proxy.ts`.
 * Si Django falla o tarda, se deja pasar: la página muestra su mensaje.
 */

export type Decision =
  { tipo: "seguir" } | { tipo: "redirigir"; ruta: string } | { tipo: "no-existe" };

const SECCION_DE = { auto: "autos", repuesto: "repuestos" } as const;
const ESPERA_MS = 2500;

type Resumen = { tipo: "auto" | "repuesto"; ruta?: string };

export async function decidirFicha(pathname: string): Promise<Decision> {
  const [, seccion, slug = ""] = pathname.split("/");
  const id = idDeSlug(slug);
  if (id === null) return { tipo: "no-existe" };

  const base = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  let respuesta: Response;
  try {
    respuesta = await fetch(`${base}/api/v1/articulos/${id}/`, {
      headers: {
        Accept: "application/json",
        "X-Servidor-Next": process.env.SERVIDOR_NEXT_SECRETO ?? "",
      },
      signal: AbortSignal.timeout(ESPERA_MS),
    });
  } catch {
    return { tipo: "seguir" };
  }
  if (respuesta.status === 404) return { tipo: "no-existe" };
  if (!respuesta.ok) return { tipo: "seguir" };

  const articulo = (await respuesta.json().catch(() => null)) as Resumen | null;
  if (!articulo) return { tipo: "seguir" };
  if (articulo.ruta) {
    return articulo.ruta === pathname
      ? { tipo: "seguir" }
      : { tipo: "redirigir", ruta: articulo.ruta };
  }
  return SECCION_DE[articulo.tipo] === seccion ? { tipo: "seguir" } : { tipo: "no-existe" };
}
