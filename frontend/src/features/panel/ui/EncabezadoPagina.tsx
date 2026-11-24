import type { ReactNode } from "react";

type Props = { titulo: string; descripcion?: string; acciones?: ReactNode };

export function EncabezadoPagina({ titulo, descripcion, acciones }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="titulo text-3xl sm:text-4xl">{titulo}</h1>
        {descripcion ? <p className="text-tinta-suave">{descripcion}</p> : null}
      </div>
      {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
    </header>
  );
}
