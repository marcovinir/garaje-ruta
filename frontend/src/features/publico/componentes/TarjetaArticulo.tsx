import Link from "next/link";
import type { ReactNode } from "react";

import type { Tarjeta } from "@/shared/api/tipos";
import { miles } from "@/shared/lib/dinero";

import { EtiquetaEstado } from "./EtiquetaEstado";
import { Foto } from "./Foto";
import { Precio } from "./Precio";

const CONDICION = { nuevo: "Nuevo", usado: "Usado" } as const;

/** Resumen compacto que también usa el listado del panel. */
export function resumenTarjeta({ auto, repuesto }: Tarjeta): string {
  if (auto) {
    return `${auto.anio} · ${miles(auto.kilometraje)} km · ${auto.transmision} · ${auto.combustible}`;
  }
  if (repuesto) {
    return [CONDICION[repuesto.condicion], repuesto.compatibilidad_resumen]
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

function DatoAuto({
  etiqueta,
  valor,
  trazo,
}: {
  etiqueta: string;
  valor: ReactNode;
  trazo: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <svg
        aria-hidden="true"
        className="size-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={trazo} />
      </svg>
      <span className="sr-only">{etiqueta}: </span>
      {valor}
    </span>
  );
}

type Props = { tarjeta: Tarjeta; prioridad?: boolean };

export function TarjetaArticulo({ tarjeta, prioridad = false }: Props) {
  const { auto, repuesto } = tarjeta;
  const titulo = auto?.nombre_vehiculo || tarjeta.titulo;
  const oferta = tarjeta.precio_anterior_colones !== null;
  const cantidad = repuesto?.cantidad;
  return (
    <Link
      href={tarjeta.ruta}
      className="tarjeta-animada bg-tarjeta border-borde text-tinta group flex min-w-0 flex-col overflow-hidden rounded-2xl border"
    >
      <div className="relative overflow-hidden">
        <Foto
          foto={tarjeta.foto}
          alt=""
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          prioridad={prioridad}
        />
        {oferta && (
          <span className="bg-rojo-fuerte absolute top-2.5 left-2.5 rounded-md px-2 py-1 text-xs font-bold text-white">
            Oferta
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-3.5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <h3 className="min-w-0 text-base leading-snug font-semibold break-words">{titulo}</h3>
          {auto && (
            <EtiquetaEstado
              estado={tarjeta.estado_publico === "reservado" ? "reservado" : "disponible"}
            />
          )}
          {repuesto &&
            (cantidad === 0 || tarjeta.estado_publico === "agotado" ? (
              <EtiquetaEstado estado="agotado" />
            ) : cantidad !== undefined ? (
              <span className="bg-disponible text-disponible-tinta rounded-full px-2.5 py-1 text-xs font-semibold">
                {cantidad === 1 ? "Queda 1" : `Quedan ${miles(cantidad)}`}
              </span>
            ) : null)}
        </div>
        {auto && (
          <div className="text-tinta-suave flex flex-col gap-1.5 text-sm">
            <span className="font-semibold">{auto.anio}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <DatoAuto
                etiqueta="Kilometraje"
                valor={`${miles(auto.kilometraje)} km`}
                trazo="M4 17a8 8 0 1 1 16 0H4Zm8-3 3-4"
              />
              <DatoAuto
                etiqueta="Transmisión"
                valor={auto.transmision}
                trazo="M6 5v14m6-14v14m6-14v7H6"
              />
              <DatoAuto
                etiqueta="Combustible"
                valor={auto.combustible}
                trazo="M4 20V4h10v16M4 12h10m0 2h2a2 2 0 0 1 2 2v2a1 1 0 0 0 2 0v-7l-3-3M2 20h14"
              />
            </div>
          </div>
        )}
        {repuesto && (
          <div className="text-tinta-suave flex flex-col gap-1 text-sm">
            <span>{CONDICION[repuesto.condicion]}</span>
            {repuesto.compatibilidad_resumen && <p>{repuesto.compatibilidad_resumen}</p>}
          </div>
        )}
        <div className="border-borde mt-auto flex flex-col gap-2 border-t pt-2">
          <Precio
            colones={tarjeta.precio_colones}
            dolares={tarjeta.precio_usd}
            anterior={tarjeta.precio_anterior_colones}
            mostrarAhorro={Boolean(auto)}
            alinearTarjeta
          />
          <span className="border-borde text-tinta group-hover:bg-campo rounded-xl border px-3 py-2 text-center text-sm font-semibold">
            Ver detalles <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
