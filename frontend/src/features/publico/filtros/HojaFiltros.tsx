"use client";

import { type ReactNode, useRef } from "react";

type Props = { activos: number; children: ReactNode };

/**
 * En el celular los filtros abren en una hoja que sube desde abajo: un `<dialog>` modal nativo
 * (foco atrapado, Esc, gesto de atrás y foco de vuelta al botón los pone el navegador).
 */
export function HojaFiltros({ activos, children }: Props) {
  const hoja = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => hoja.current?.showModal()}
        className="border-borde bg-tarjeta inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 font-semibold"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {activos ? `Filtros (${activos})` : "Filtros"}
      </button>
      <dialog
        ref={hoja}
        closedby="any"
        aria-labelledby="titulo-hoja-filtros"
        // Al aplicar, el formulario navega y la hoja se cierra.
        onSubmit={() => hoja.current?.close()}
        onClick={(evento) => {
          // Respaldo de closedby="any" (Safari): tocar el fondo, fuera de la hoja, la cierra.
          const dialogo = evento.currentTarget;
          if ("closedBy" in HTMLDialogElement.prototype || evento.target !== dialogo) return;
          const r = dialogo.getBoundingClientRect();
          const dentro =
            r.top <= evento.clientY &&
            evento.clientY <= r.bottom &&
            r.left <= evento.clientX &&
            evento.clientX <= r.right;
          if (!dentro) dialogo.close();
        }}
        className="hoja-filtros bg-tarjeta text-tinta"
      >
        <div className="border-borde bg-tarjeta sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2">
          <h2 id="titulo-hoja-filtros" className="titulo text-2xl">
            Filtros
          </h2>
          <button
            type="button"
            onClick={() => hoja.current?.close()}
            aria-label="Cerrar filtros"
            className="hover:bg-campo inline-flex size-11 items-center justify-center rounded-full text-2xl"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="px-4 pt-4">{children}</div>
      </dialog>
    </>
  );
}
