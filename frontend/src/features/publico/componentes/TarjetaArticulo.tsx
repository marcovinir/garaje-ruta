import Link from "next/link";

import type { Tarjeta } from "@/shared/api/tipos";
import { miles } from "@/shared/lib/dinero";

import { Foto } from "./Foto";
import { Precio } from "./Precio";

const CONDICION = { nuevo: "Nuevo", usado: "Usado" } as const;

export function resumenTarjeta(t: Tarjeta): string {
  if (t.auto) {
    const a = t.auto;
    return `${a.anio} · ${miles(a.kilometraje)} km · ${a.transmision} · ${a.combustible}`;
  }
  if (t.repuesto) {
    const r = t.repuesto;
    return [CONDICION[r.condicion], r.compatibilidad_resumen].filter(Boolean).join(" · ");
  }
  return "";
}

type Props = { tarjeta: Tarjeta; prioridad?: boolean };

export function TarjetaArticulo({ tarjeta, prioridad = false }: Props) {
  const oferta = tarjeta.precio_anterior_colones !== null;
  return (
    <Link
      href={tarjeta.ruta}
      className="tarjeta-animada bg-tarjeta border-borde text-tinta flex flex-col overflow-hidden rounded-2xl border"
    >
      <div className="relative overflow-hidden">
        <Foto
          foto={tarjeta.foto}
          alt={tarjeta.titulo}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          prioridad={prioridad}
        />
        {oferta ? (
          <span className="bg-rojo absolute top-2.5 left-2.5 rounded-md px-2 py-1 text-xs font-bold text-white">
            OFERTA
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
        <h3 className="text-base leading-snug font-semibold">{tarjeta.titulo}</h3>
        <p className="text-tinta-suave text-sm">{resumenTarjeta(tarjeta)}</p>
        <Precio
          colones={tarjeta.precio_colones}
          dolares={tarjeta.precio_usd}
          anterior={tarjeta.precio_anterior_colones}
        />
      </div>
    </Link>
  );
}
