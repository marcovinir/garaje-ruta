import Link from "next/link";

import { type Filtros, aQueryString } from "./filtrosDesdeUrl";

const OPCIONES = [
  { valor: "recientes", texto: "Recientes" },
  { valor: "precio_asc", texto: "Menor precio" },
  { valor: "precio_desc", texto: "Mayor precio" },
] as const;

type Props = { base: string; filtros: Filtros };

/** Orden por enlaces: funciona sin JavaScript y queda en la URL. */
export function Orden({ base, filtros }: Props) {
  const actual = filtros.orden ?? "recientes";
  return (
    <nav aria-label="Ordenar" className="flex flex-wrap items-center gap-1 text-sm">
      <span className="text-tinta-suave mr-1">Ordenar:</span>
      {OPCIONES.map(({ valor, texto }) => {
        const resto: Filtros = { ...filtros };
        delete resto.page;
        if (valor === "recientes") delete resto.orden;
        else resto.orden = valor;
        const activo = valor === actual;
        return (
          <Link
            key={valor}
            href={`${base}${aQueryString(resto)}`}
            aria-current={activo ? "true" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-3 font-semibold ${
              activo ? "bg-carbon text-white" : "text-tinta-suave hover:text-tinta"
            }`}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
