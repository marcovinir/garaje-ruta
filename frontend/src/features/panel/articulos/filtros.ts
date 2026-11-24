/** Filtros del listado del panel en la URL (RF-30), validados antes de llegar a Django. */

export type FiltrosPanel = Partial<
  Record<"q" | "tipo" | "estado" | "agotado" | "desde" | "hasta" | "orden" | "page", string>
>;

const TIPOS = ["auto", "repuesto"];
const ESTADOS = ["disponible", "reservado", "oculto", "vendido"];
const ORDENES = ["recientes", "actualizados"];

/** `AAAA-MM-DD` que además existe en el calendario (nada de 31 de febrero). */
export function esFecha(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

const REGLAS: Record<keyof FiltrosPanel, (v: string) => boolean> = {
  q: (v) => v.trim().length > 0,
  tipo: (v) => TIPOS.includes(v),
  estado: (v) => ESTADOS.includes(v),
  agotado: (v) => v === "1",
  desde: esFecha,
  hasta: esFecha,
  orden: (v) => ORDENES.includes(v) && v !== "recientes",
  page: (v) => /^[1-9]\d{0,5}$/.test(v) && v !== "1",
};

export function filtrosPanelDesdeUrl(params: URLSearchParams): FiltrosPanel {
  const filtros: FiltrosPanel = {};
  for (const clave of Object.keys(REGLAS) as (keyof FiltrosPanel)[]) {
    const valor = params.get(clave);
    if (valor !== null && REGLAS[clave](valor)) {
      filtros[clave] = clave === "q" ? valor.trim().slice(0, 100) : valor;
    }
  }
  return filtros;
}

export function aBusqueda(filtros: FiltrosPanel): string {
  const pares = Object.entries(filtros)
    .filter((par): par is [string, string] => Boolean(par[1]))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = new URLSearchParams(pares).toString();
  return query ? `?${query}` : "";
}

/** Query con un filtro cambiado (vacío = quitarlo), de vuelta en la primera página. */
export function conFiltro(filtros: FiltrosPanel, clave: keyof FiltrosPanel, valor: string): string {
  const nuevos: FiltrosPanel = { ...filtros, [clave]: valor };
  if (clave !== "page") delete nuevos.page;
  return aBusqueda(nuevos);
}
