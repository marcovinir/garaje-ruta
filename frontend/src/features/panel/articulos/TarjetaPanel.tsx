import type { ReactNode } from "react";

import { Foto } from "@/features/publico/componentes/Foto";
import { colones } from "@/shared/lib/dinero";

import { TARJETA } from "../ui/estilos";
import { EstadoFila, TituloFila, fechaCorta, resumenFila } from "./piezas";
import type { FilaPanel } from "./tipos";

/** Celular y tablet: una tarjeta por artículo con sus acciones rápidas abajo. */
export function TarjetaPanel({
  fila,
  puedeEditar,
  acciones,
}: {
  fila: FilaPanel;
  puedeEditar: boolean;
  acciones?: ReactNode;
}) {
  const id = `fila-${fila.id}`;
  return (
    <article aria-labelledby={id} className={`${TARJETA} flex flex-col gap-3 p-3`}>
      <div className="flex gap-3">
        <div className="w-24 shrink-0 overflow-hidden rounded-xl">
          <Foto foto={fila.foto} alt="" sizes="96px" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <TituloFila fila={fila} puedeEditar={puedeEditar} id={id} />
          <p className="text-tinta-suave truncate text-sm">{resumenFila(fila)}</p>
          <p className="titulo text-xl leading-none">{colones(fila.precio_colones)}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <EstadoFila fila={fila} />
            <span className="text-tinta-suave text-xs">{fechaCorta(fila.actualizado_en)}</span>
          </div>
        </div>
      </div>
      {acciones}
    </article>
  );
}
