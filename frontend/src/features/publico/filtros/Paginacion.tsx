import Link from "next/link";

import { type Filtros, aQueryString } from "./filtrosDesdeUrl";

/** Tamaño de página de la API (backend/apps/comun/paginacion.py). */
export const POR_PAGINA = 20;

type Props = { base: string; filtros: Filtros; total: number };

function hrefPagina(base: string, filtros: Filtros, pagina: number): string {
  const resto: Filtros = { ...filtros };
  if (pagina > 1) resto.page = String(pagina);
  else delete resto.page;
  return `${base}${aQueryString(resto)}`;
}

const ENLACE =
  "border-borde bg-tarjeta hover:border-rojo inline-flex min-h-11 items-center rounded-xl border px-4 font-semibold";

export function Paginacion({ base, filtros, total }: Props) {
  const paginas = Math.ceil(total / POR_PAGINA);
  if (paginas <= 1) return null;
  const actual = Math.min(Number(filtros.page ?? "1"), paginas);
  return (
    <nav aria-label="Páginas" className="flex items-center justify-between gap-3">
      {actual > 1 ? (
        <Link href={hrefPagina(base, filtros, actual - 1)} rel="prev" className={ENLACE}>
          Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-tinta-suave text-sm">
        Página {actual} de {paginas}
      </span>
      {actual < paginas ? (
        <Link href={hrefPagina(base, filtros, actual + 1)} rel="next" className={ENLACE}>
          Siguiente
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
