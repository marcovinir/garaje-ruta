import Link from "next/link";
import { Suspense } from "react";

import { obtenerArticulos, obtenerCatalogos } from "@/shared/api/datos";

import { Esqueleto } from "../componentes/Esqueleto";
import { MensajeError } from "../componentes/MensajeError";
import { TarjetaArticulo } from "../componentes/TarjetaArticulo";
import { AvisoCompatibilidad } from "./AvisoCompatibilidad";
import { ChipsFiltros } from "./ChipsFiltros";
import { HojaFiltros } from "./HojaFiltros";
import { Orden } from "./Orden";
import { Paginacion } from "./Paginacion";
import { PanelFiltros } from "./PanelFiltros";
import {
  type TipoListado,
  aQueryString,
  cantidadFiltros,
  filtrosDesdeUrl,
  hrefSin,
} from "./filtrosDesdeUrl";

export type ParamsUrl = Record<string, string | string[] | undefined>;

const BASE = { auto: "/autos", repuesto: "/repuestos" } as const;
const NOMBRES = { auto: ["auto", "autos"], repuesto: ["repuesto", "repuestos"] } as const;

/**
 * Canónica del listado: los filtros apuntan a la página base (son variaciones del mismo
 * contenido), pero cada página de la paginación es la suya propia.
 */
export async function canonicaListado(
  tipo: TipoListado,
  searchParams: Promise<ParamsUrl>,
): Promise<string> {
  const { page } = filtrosDesdeUrl(await searchParams, tipo);
  return `${BASE[tipo]}${page ? aQueryString({ page }) : ""}`;
}

export function cantidad(n: number, tipo: TipoListado): string {
  return `${n} ${NOMBRES[tipo][n === 1 ? 0 : 1]}`;
}

async function Resultados({
  tipo,
  searchParams,
}: {
  tipo: TipoListado;
  searchParams: Promise<ParamsUrl>;
}) {
  const filtros = filtrosDesdeUrl(await searchParams, tipo);
  const base = BASE[tipo];
  const [pagina, catalogos] = await Promise.all([
    obtenerArticulos({ ...filtros, tipo }).catch(() => null),
    obtenerCatalogos().catch(() => null),
  ]);
  if (pagina === null) return <MensajeError />;

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label="Filtros" className="hidden lg:block">
        {catalogos ? (
          <div className="bg-tarjeta border-borde sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border px-5 pt-5">
            <PanelFiltros tipo={tipo} id="lateral" filtros={filtros} catalogos={catalogos} />
          </div>
        ) : null}
      </aside>
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="font-semibold">
            {cantidad(pagina.count, tipo)}
            {filtros.q ? ` para «${filtros.q}»` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {catalogos ? (
              <div className="lg:hidden">
                <HojaFiltros activos={cantidadFiltros(filtros)}>
                  <PanelFiltros tipo={tipo} id="hoja" filtros={filtros} catalogos={catalogos} />
                </HojaFiltros>
              </div>
            ) : null}
            <Orden base={base} filtros={filtros} />
          </div>
        </div>
        {catalogos ? <ChipsFiltros base={base} filtros={filtros} catalogos={catalogos} /> : null}
        {tipo === "repuesto" && catalogos ? (
          <AvisoCompatibilidad filtros={filtros} catalogos={catalogos} />
        ) : null}
        <h2 className="sr-only">Resultados</h2>
        {pagina.results.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pagina.results.map((t, i) => (
              <li key={t.id} className="grid">
                <TarjetaArticulo tarjeta={t} prioridad={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-tarjeta border-borde flex flex-col items-center gap-3 rounded-2xl border px-5 py-12 text-center">
            {filtros.page ? (
              <>
                <p className="titulo text-2xl">Esa página no existe</p>
                <Link
                  href={hrefSin(base, filtros, "page")}
                  className="text-rojo-oscuro font-semibold underline-offset-4 hover:underline"
                >
                  Ir a la primera página →
                </Link>
              </>
            ) : (
              <>
                <p className="titulo text-2xl">Sin resultados</p>
                <p className="text-tinta-suave">
                  No hay {NOMBRES[tipo][1]} con esos filtros. Probá quitando alguno.
                </p>
                <Link
                  href={base}
                  className="text-rojo-oscuro font-semibold underline-offset-4 hover:underline"
                >
                  Ver todos los {NOMBRES[tipo][1]} →
                </Link>
              </>
            )}
          </div>
        )}
        <Paginacion base={base} filtros={filtros} total={pagina.count} />
      </div>
    </div>
  );
}

function EsqueletoListado() {
  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <Esqueleto alto="h-[32rem]" className="hidden lg:block" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Esqueleto />
        <Esqueleto className="hidden sm:block" />
        <Esqueleto className="hidden xl:block" />
      </div>
    </div>
  );
}

type Props = {
  tipo: TipoListado;
  titulo: string;
  intro: string;
  searchParams: Promise<ParamsUrl>;
};

export function Listado({ tipo, titulo, intro, searchParams }: Props) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="titulo text-4xl sm:text-5xl">{titulo}</h1>
        <p className="text-tinta-suave max-w-2xl">{intro}</p>
      </header>
      <Suspense fallback={<EsqueletoListado />}>
        <Resultados tipo={tipo} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
