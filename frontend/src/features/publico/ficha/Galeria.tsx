"use client";

import { useRef, useState } from "react";

import type { FotoApi } from "@/shared/api/tipos";

import { Foto } from "../componentes/Foto";

type Props = { fotos: FotoApi[]; titulo: string };

function desplazamiento(): ScrollBehavior {
  const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return reducido ? "auto" : "smooth";
}

const FLECHA =
  "bg-tarjeta/90 text-tinta hover:bg-tarjeta absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md sm:inline-flex disabled:opacity-0";

/**
 * Galería: en el celular se desliza con el dedo (scroll-snap); en escritorio, flechas y
 * miniaturas. Con teclado: las miniaturas son botones y, con el foco en la galería, ← y →.
 */
export function Galeria({ fotos, titulo }: Props) {
  const [actual, setActual] = useState(0);
  const lista = useRef<HTMLUListElement>(null);
  const total = fotos.length;

  if (total === 0) {
    return (
      <div className="overflow-hidden rounded-2xl">
        <Foto foto={null} alt={titulo} sizes="(max-width: 1024px) 100vw, 640px" prioridad />
      </div>
    );
  }

  const alt = (i: number) => (total > 1 ? `${titulo}, foto ${i + 1} de ${total}` : titulo);

  function ir(indice: number) {
    const destino = Math.min(Math.max(indice, 0), total - 1);
    setActual(destino);
    const el = lista.current;
    el?.scrollTo?.({ left: destino * el.clientWidth, behavior: desplazamiento() });
  }

  return (
    <div className="flex flex-col gap-3">
      <section
        aria-label={`Fotos de ${titulo}`}
        aria-roledescription="carrusel"
        tabIndex={0}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowRight") ir(actual + 1);
          else if (evento.key === "ArrowLeft") ir(actual - 1);
          else return;
          evento.preventDefault();
        }}
        className="relative overflow-hidden rounded-2xl"
      >
        <ul
          ref={lista}
          onScroll={(evento) => {
            const el = evento.currentTarget;
            if (el.clientWidth) setActual(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="sin-barra flex snap-x snap-mandatory overflow-x-auto"
        >
          {fotos.map((foto, i) => (
            <li key={foto.public_id} className="w-full shrink-0 snap-center">
              <Foto
                foto={foto}
                alt={alt(i)}
                sizes="(max-width: 1024px) 100vw, 640px"
                prioridad={i === 0}
              />
            </li>
          ))}
        </ul>
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              disabled={actual === 0}
              onClick={() => ir(actual - 1)}
              className={`${FLECHA} left-3`}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              disabled={actual === total - 1}
              onClick={() => ir(actual + 1)}
              className={`${FLECHA} right-3`}
            >
              <span aria-hidden="true">›</span>
            </button>
            <p className="bg-carbon/80 absolute right-3 bottom-3 rounded-full px-3 py-1 text-sm font-semibold text-white">
              {actual + 1} de {total}
            </p>
          </>
        ) : null}
      </section>
      {total > 1 ? (
        <ul className="hidden grid-cols-5 gap-2 sm:grid">
          {fotos.map((foto, i) => (
            <li key={foto.public_id}>
              <button
                type="button"
                aria-label={`Foto ${i + 1} de ${total}`}
                aria-current={i === actual ? "true" : undefined}
                onClick={() => ir(i)}
                className={`block w-full overflow-hidden rounded-xl border-2 ${
                  i === actual ? "border-rojo" : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <Foto foto={foto} alt="" sizes="120px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
