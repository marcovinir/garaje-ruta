/**
 * Filtros del listado en la URL (§10). La URL es pública y se comparte por WhatsApp, así que
 * todo valor se valida aquí: lo que no sirve se descarta y nunca llega a Django.
 */

export type TipoListado = "auto" | "repuesto";
export type Filtros = Record<string, string>;
type ParamsUrl = Record<string, string | string[] | undefined>;

type Regla = "entero" | "lista" | "slug" | "texto" | ((v: string) => boolean);

export const ORDENES = ["recientes", "precio_asc", "precio_desc"] as const;

const COMUNES: Record<string, Regla> = {
  q: "texto",
  precio_min: "entero",
  precio_max: "entero",
  ofertas: (v) => v === "1",
  orden: (v) => (ORDENES as readonly string[]).includes(v),
  page: "entero",
};

const POR_TIPO: Record<TipoListado, Record<string, Regla>> = {
  auto: {
    marca: "entero",
    modelo: "entero",
    anio_min: "entero",
    anio_max: "entero",
    km_max: "entero",
    transmision: "entero",
    combustible: "entero",
    traccion: "entero",
    carroceria: "slug",
    equipamiento: "lista",
  },
  repuesto: {
    categoria: "slug",
    condicion: (v) => v === "nuevo" || v === "usado",
    compatible_marca: "entero",
    compatible_modelo: "entero",
    compatible_anio: "entero",
  },
};

const ENTERO = /^[1-9]\d{0,9}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TEXTO = 100;

function limpiar(regla: Regla, crudo: string | string[]): string | null {
  if (regla === "lista") {
    const valores = (Array.isArray(crudo) ? crudo : [crudo]).flatMap((v) => v.split(","));
    const ids = [...new Set(valores.map((v) => v.trim()).filter((v) => ENTERO.test(v)))];
    return ids.length ? ids.sort((a, b) => Number(a) - Number(b)).join(",") : null;
  }
  const valor = (Array.isArray(crudo) ? (crudo[0] ?? "") : crudo).trim();
  if (!valor) return null;
  if (regla === "entero") return ENTERO.test(valor) ? valor : null;
  if (regla === "slug") return SLUG.test(valor) ? valor : null;
  if (regla === "texto") return valor.slice(0, MAX_TEXTO);
  return regla(valor) ? valor : null;
}

export function filtrosDesdeUrl(params: ParamsUrl, tipo: TipoListado): Filtros {
  const reglas = { ...COMUNES, ...POR_TIPO[tipo] };
  const filtros: Filtros = {};
  for (const [clave, regla] of Object.entries(reglas)) {
    const crudo = params[clave];
    if (crudo === undefined) continue;
    const valor = limpiar(regla, crudo);
    if (valor !== null) filtros[clave] = valor;
  }
  if (filtros.page === "1") delete filtros.page;
  return filtros;
}

export function aQueryString(filtros: Filtros): string {
  const query = new URLSearchParams(
    Object.entries(filtros).sort(([a], [b]) => a.localeCompare(b)),
  ).toString();
  return query ? `?${query}` : "";
}

/** Enlace sin ese filtro (o sin un elemento de una lista), de vuelta en la primera página. */
export function hrefSin(base: string, filtros: Filtros, clave: string, elemento?: string): string {
  const resto: Filtros = { ...filtros };
  delete resto.page;
  if (elemento !== undefined && resto[clave]) {
    const quedan = resto[clave].split(",").filter((v) => v !== elemento);
    if (quedan.length) resto[clave] = quedan.join(",");
    else delete resto[clave];
  } else {
    delete resto[clave];
  }
  return `${base}${aQueryString(resto)}`;
}

/** Parámetros que el listado no cuenta como filtros (no tienen chip ni suman en «Filtros (n)»). */
export const NO_SON_FILTROS = new Set(["orden", "page"]);

export function cantidadFiltros(filtros: Filtros): number {
  return Object.entries(filtros)
    .filter(([clave]) => !NO_SON_FILTROS.has(clave))
    .reduce((n, [clave, valor]) => n + (clave === "equipamiento" ? valor.split(",").length : 1), 0);
}
