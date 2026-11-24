import { createHash, timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

/**
 * Django avisa aquí qué cambió (backend/apps/comun/revalidacion.py). Cada etiqueta se invalida
 * de inmediato (`expire: 0`): la siguiente visita ya ve el auto vendido o el precio nuevo.
 */

const ETIQUETA = /^[a-z0-9-]{1,64}$/;
const MAX_ETIQUETAS = 50;

function mismoSecreto(recibido: string, esperado: string): boolean {
  // Se comparan los hashes para que el tiempo no dependa del largo ni de los caracteres.
  const a = createHash("sha256").update(recibido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

function etiquetasValidas(cuerpo: unknown): string[] | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;
  const { etiquetas } = cuerpo as { etiquetas?: unknown };
  if (!Array.isArray(etiquetas) || etiquetas.length === 0 || etiquetas.length > MAX_ETIQUETAS) {
    return null;
  }
  if (!etiquetas.every((e): e is string => typeof e === "string" && ETIQUETA.test(e))) return null;
  return [...new Set(etiquetas)];
}

export async function POST(request: Request): Promise<Response> {
  const secreto = process.env.REVALIDACION_SECRETO;
  if (!secreto) return Response.json({ detalle: "Revalidación no configurada." }, { status: 503 });

  const autorizacion = request.headers.get("authorization") ?? "";
  const token = autorizacion.startsWith("Bearer ") ? autorizacion.slice(7) : "";
  if (!token || !mismoSecreto(token, secreto)) {
    return Response.json({ detalle: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const etiquetas = etiquetasValidas(cuerpo);
  if (etiquetas === null) {
    return Response.json(
      { detalle: `Se espera {"etiquetas": [...]} con 1 a ${MAX_ETIQUETAS} etiquetas válidas.` },
      { status: 400 },
    );
  }

  for (const etiqueta of etiquetas) revalidateTag(etiqueta, { expire: 0 });
  return Response.json({ revalidadas: etiquetas.length });
}
