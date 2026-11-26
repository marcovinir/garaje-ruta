export type TipoEvento =
  | "vehicle_view"
  | "part_view"
  | "whatsapp_click"
  | "visit_request"
  | "compatibility_request"
  | "search_submitted"
  | "filter_applied"
  | "offer_view";

export type AccionWhatsapp = "visit_request" | "compatibility_request";
type Pagina =
  | "inicio"
  | "autos"
  | "repuestos"
  | "ficha_auto"
  | "ficha_repuesto"
  | "contacto"
  | "buscar"
  | "otra";
type Seccion =
  | "encabezado"
  | "ficha"
  | "flotante"
  | "pie"
  | "contacto"
  | "ofertas"
  | "filtros"
  | "compatibilidad";

type DatosEvento = {
  articulo?: number;
  contexto?: { pagina?: Pagina; seccion?: Seccion; filtros?: string[] };
};

export function paginaDeEvento(ruta: string): { pagina: Pagina; articulo?: number } {
  if (ruta === "/") return { pagina: "inicio" };
  if (ruta === "/autos") return { pagina: "autos" };
  if (ruta === "/repuestos") return { pagina: "repuestos" };
  if (ruta === "/contacto") return { pagina: "contacto" };
  if (ruta === "/buscar") return { pagina: "buscar" };

  const ficha = /^\/(autos|repuestos)\/[^/]+-(\d+)$/.exec(ruta);
  if (!ficha) return { pagina: "otra" };
  const articulo = Number(ficha[2]);
  return {
    pagina: ficha[1] === "autos" ? "ficha_auto" : "ficha_repuesto",
    articulo: Number.isSafeInteger(articulo) && articulo > 0 ? articulo : undefined,
  };
}

export function registrarEvento(tipo: TipoEvento, datos: DatosEvento = {}): void {
  try {
    const dispositivo = window.matchMedia?.("(max-width: 767px)")?.matches
      ? "celular"
      : "escritorio";
    void fetch("/api/v1/eventos/", {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, ...datos, dispositivo }),
    }).catch(() => {});
  } catch {
    // La telemetría nunca altera la acción de la persona.
  }
}
