/**
 * Ruta pública del panel (§9): en local `/panel`, en producción algo no obvio. El código vive
 * siempre en `app/panel/`; `proxy.ts` reescribe la ruta configurada hacia ahí. Esto solo reduce
 * el ruido de bots: la seguridad real son los permisos de la API.
 */

const POR_DEFECTO = "/panel";
const FORMATO = /^\/[a-z0-9-]+$/;
// Rutas de la web pública que el panel no puede tapar.
const RESERVADAS = new Set(["/autos", "/repuestos", "/buscar", "/api", "/marca", "/no-encontrado"]);

export function baseDelPanel(): string {
  // Literal completo para que Next lo inyecte en el código del navegador.
  const valor = (process.env.NEXT_PUBLIC_PANEL_RUTA ?? "").trim().replace(/\/+$/, "");
  return FORMATO.test(valor) && !RESERVADAS.has(valor) ? valor : POR_DEFECTO;
}

/** `rutaPanel("articulos/12")` → `/gestion-9x2/articulos/12`. */
export function rutaPanel(subruta = ""): string {
  const resto = subruta.replace(/^\/+/, "");
  return resto ? `${baseDelPanel()}/${resto}` : baseDelPanel();
}

export type DecisionPanel =
  { tipo: "seguir" } | { tipo: "reescribir"; destino: string } | { tipo: "no-existe" };

function bajo(pathname: string, prefijo: string): string | null {
  if (pathname === prefijo) return "";
  return pathname.startsWith(`${prefijo}/`) ? pathname.slice(prefijo.length) : null;
}

export function decidirPanel(pathname: string, base: string): DecisionPanel {
  if (base !== POR_DEFECTO) {
    const resto = bajo(pathname, base);
    if (resto !== null) return { tipo: "reescribir", destino: `${POR_DEFECTO}${resto}` };
    if (bajo(pathname, POR_DEFECTO) !== null) return { tipo: "no-existe" };
  }
  return { tipo: "seguir" };
}

export function esDelPanel(pathname: string, base: string): boolean {
  return bajo(pathname, base) !== null || bajo(pathname, POR_DEFECTO) !== null;
}
