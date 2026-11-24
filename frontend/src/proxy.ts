import { type NextRequest, NextResponse } from "next/server";

import { decidirFicha } from "@/features/publico/ficha/decidirFicha";

/** Códigos HTTP reales para las fichas: 308 a la URL canónica y 404 si el artículo no existe. */
export async function proxy(request: NextRequest) {
  const decision = await decidirFicha(request.nextUrl.pathname);
  if (decision.tipo === "redirigir") {
    return NextResponse.redirect(new URL(decision.ruta, request.url), 308);
  }
  if (decision.tipo === "no-existe") {
    // Una ruta que no existe muestra not-found.tsx con estado 404.
    return NextResponse.rewrite(new URL("/no-encontrado", request.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/autos/:slug", "/repuestos/:slug"],
};
