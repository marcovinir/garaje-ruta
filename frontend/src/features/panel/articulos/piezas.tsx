import Link from "next/link";

import { EtiquetaEstado } from "@/features/publico/componentes/EtiquetaEstado";
import { resumenTarjeta } from "@/features/publico/componentes/TarjetaArticulo";

import { rutaPanel } from "../rutaPanel";
import type { FilaPanel } from "./tipos";

/** Estado con color y texto; un repuesto suma «Agotado» o «Quedan N». */
export function EstadoFila({ fila }: { fila: FilaPanel }) {
  const agotado = fila.tipo === "repuesto" && fila.agotado && fila.estado !== "oculto";
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <EtiquetaEstado estado={agotado ? "agotado" : fila.estado} />
      {fila.tipo === "repuesto" && !agotado && fila.cantidad !== null ? (
        <span className="text-tinta-suave text-xs font-semibold">Quedan {fila.cantidad}</span>
      ) : null}
    </span>
  );
}

/** Título que lleva a editar (o a la ficha pública si el rol solo puede ver). */
export function TituloFila({
  fila,
  puedeEditar,
  id,
}: {
  fila: FilaPanel;
  puedeEditar: boolean;
  id?: string;
}) {
  const clase = "hover:text-rojo-oscuro font-bold underline-offset-4 hover:underline";
  return puedeEditar ? (
    <Link id={id} href={rutaPanel(`articulos/${fila.id}`)} className={clase}>
      {fila.titulo}
    </Link>
  ) : (
    <a id={id} href={fila.ruta} target="_blank" rel="noopener" className={clase}>
      {fila.titulo}
    </a>
  );
}

export function resumenFila(fila: FilaPanel): string {
  return resumenTarjeta(fila);
}

const FECHA = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Costa_Rica",
});

export function fechaCorta(iso: string): string {
  return FECHA.format(new Date(iso));
}
