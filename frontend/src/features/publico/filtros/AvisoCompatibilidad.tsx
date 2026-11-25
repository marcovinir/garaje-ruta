import Link from "next/link";
import type { Catalogos } from "@/shared/api/tipos";
import { type Filtros, aQueryString } from "./filtrosDesdeUrl";

type Props = { catalogos: Catalogos; filtros: Filtros };

/** Describe solo el vehículo reconocible en los catálogos, sin inventar nombres para IDs viejos. */
export function AvisoCompatibilidad({ catalogos, filtros }: Props) {
  const marcaDelModelo = catalogos.marcas.find((m) =>
    m.modelos.some((modelo) => String(modelo.id) === filtros.compatible_modelo),
  );
  const marca = filtros.compatible_marca
    ? catalogos.marcas.find((m) => String(m.id) === filtros.compatible_marca)
    : marcaDelModelo;
  const modelo = marca?.modelos.find((m) => String(m.id) === filtros.compatible_modelo);
  const nombre =
    modelo && marca
      ? modelo.nombre
          .toLocaleLowerCase("es-CR")
          .startsWith(marca.nombre.toLocaleLowerCase("es-CR") + " ")
        ? modelo.nombre
        : `${marca.nombre} ${modelo.nombre}`
      : marca?.nombre;
  const vehiculo = nombre
    ? [nombre, filtros.compatible_anio].filter(Boolean).join(" ")
    : filtros.compatible_anio
      ? `vehículos del año ${filtros.compatible_anio}`
      : null;
  if (!vehiculo) return null;
  const restantes = { ...filtros };
  for (const clave of ["compatible_marca", "compatible_modelo", "compatible_anio", "page"])
    delete restantes[clave];
  return (
    <div
      role="status"
      className="bg-tarjeta border-borde flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
    >
      <p className="min-w-0 break-words">Mostrando repuestos compatibles con {vehiculo}</p>
      <Link
        href={`/repuestos${aQueryString(restantes)}`}
        className="text-rojo-oscuro inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
      >
        Quitar vehículo
      </Link>
    </div>
  );
}
