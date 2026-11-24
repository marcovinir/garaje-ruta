import Link from "next/link";

import { obtenerArticulos } from "@/shared/api/datos";
import type { Pagina, Tarjeta } from "@/shared/api/tipos";

import { MensajeError } from "../componentes/MensajeError";
import { TarjetaArticulo } from "../componentes/TarjetaArticulo";
import { type TipoListado, aQueryString, filtrosDesdeUrl } from "./filtrosDesdeUrl";

type ParamsUrl = Record<string, string | string[] | undefined>;

const MAXIMO = 8;
const SECCIONES = [
  { tipo: "auto", titulo: "Autos", base: "/autos", plural: "autos" },
  { tipo: "repuesto", titulo: "Repuestos", base: "/repuestos", plural: "repuestos" },
] as const;

function Seccion({
  titulo,
  base,
  plural,
  q,
  pagina,
}: {
  titulo: string;
  base: string;
  plural: string;
  q: string;
  pagina: Pagina<Tarjeta>;
}) {
  if (!pagina.results.length) return null;
  const id = `resultados-${plural}`;
  return (
    <section aria-labelledby={id} className="aparece flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id={id} className="titulo text-3xl">
          {titulo} <span className="text-tinta-suave text-xl">({pagina.count})</span>
        </h2>
        {pagina.count > pagina.results.slice(0, MAXIMO).length ? (
          <Link
            href={`${base}${aQueryString({ q })}`}
            className="text-rojo-oscuro font-semibold underline-offset-4 hover:underline"
          >
            Ver los {pagina.count} {plural} →
          </Link>
        ) : null}
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pagina.results.slice(0, MAXIMO).map((t) => (
          <li key={t.id} className="grid">
            <TarjetaArticulo tarjeta={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function ResultadosBusqueda({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  // La búsqueda acepta los mismos parámetros que cualquier listado; aquí solo importa `q`.
  const q = filtrosDesdeUrl(await searchParams, "auto").q ?? "";
  const formulario = (
    <form action="/buscar" role="search" className="flex max-w-2xl gap-2">
      <label htmlFor="q-buscar" className="sr-only">
        Qué buscás
      </label>
      <input
        id="q-buscar"
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Ej.: Corolla 2015, pastillas de freno"
        className="bg-tarjeta border-borde min-h-11 flex-1 rounded-xl border px-4"
      />
      <button
        type="submit"
        className="bg-rojo hover:bg-rojo-oscuro min-h-11 rounded-xl px-5 font-semibold text-white"
      >
        Buscar
      </button>
    </form>
  );
  if (!q) {
    return (
      <div className="flex flex-col gap-4">
        {formulario}
        <p className="text-tinta-suave">Escribí una marca, un modelo o una pieza.</p>
      </div>
    );
  }

  const paginas = await Promise.all(
    SECCIONES.map(({ tipo }) =>
      obtenerArticulos({ q, tipo: tipo satisfies TipoListado }).catch(() => null),
    ),
  );
  if (paginas.some((p) => p === null)) {
    return (
      <div className="flex flex-col gap-6">
        {formulario}
        <MensajeError />
      </div>
    );
  }
  const vacio = paginas.every((p) => !p?.results.length);
  return (
    <div className="flex flex-col gap-10">
      {formulario}
      {vacio ? (
        <p role="status" className="text-tinta-suave">
          No encontramos nada para «{q}».
        </p>
      ) : (
        SECCIONES.map((s, i) => (
          <Seccion key={s.tipo} {...s} q={q} pagina={paginas[i] as Pagina<Tarjeta>} />
        ))
      )}
    </div>
  );
}
