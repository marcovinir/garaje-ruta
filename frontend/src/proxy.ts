import { type NextRequest, NextResponse } from "next/server";

import { baseDelPanel, decidirPanel, esDelPanel } from "@/features/panel/rutaPanel";
import { decidirFicha } from "@/features/publico/ficha/decidirFicha";

const FICHA = /^\/(autos|repuestos)\/[^/]+$/;
const NO_INDEXAR = "noindex, nofollow";

/**
 * - Panel: la ruta configurada (`NEXT_PUBLIC_PANEL_RUTA`) se reescribe a `/panel`, que directo
 *   da 404 cuando la ruta es otra; todo lo del panel lleva `X-Robots-Tag: noindex`.
 * - Fichas: 308 a la URL canónica y 404 si el artículo no existe, antes del streaming.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const base = baseDelPanel();

  if (esDelPanel(pathname, base)) {
    const decision = decidirPanel(pathname, base);
    const respuesta =
      decision.tipo === "reescribir"
        ? NextResponse.rewrite(new URL(decision.destino + request.nextUrl.search, request.url))
        : decision.tipo === "no-existe"
          ? NextResponse.rewrite(new URL("/no-encontrado", request.url), { status: 404 })
          : NextResponse.next();
    respuesta.headers.set("X-Robots-Tag", NO_INDEXAR);
    return respuesta;
  }

  if (FICHA.test(pathname)) {
    const decision = await decidirFicha(pathname);
    if (decision.tipo === "redirigir") {
      return NextResponse.redirect(new URL(decision.ruta, request.url), 308);
    }
    if (decision.tipo === "no-existe") {
      // Una ruta que no existe muestra not-found.tsx con estado 404.
      return NextResponse.rewrite(new URL("/no-encontrado", request.url), { status: 404 });
    }
  }
  return NextResponse.next();
}

export const config = {
  // Constante (Next la analiza al compilar): todo menos lo estático y la API.
  matcher: ["/((?!_next/|api/|marca/|robots\\.txt|sitemap\\.xml|.*\\.[a-z0-9]+$).*)"],
};
