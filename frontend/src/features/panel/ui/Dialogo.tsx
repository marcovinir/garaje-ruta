"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { BOTON_PELIGRO, BOTON_PRIMARIO, BOTON_SECUNDARIO } from "./estilos";

type Props = {
  abierto: boolean;
  titulo: string;
  children?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligroso?: boolean;
  ocupado?: boolean;
  /** Sin `alConfirmar` el diálogo solo muestra contenido (p. ej. un formulario con sus botones). */
  alConfirmar?: () => void;
  alCerrar: () => void;
};

/**
 * Diálogo modal nativo (`showModal`): foco atrapado, Esc y foco de vuelta los pone el navegador.
 * Se usa para confirmar acciones destructivas y para formularios cortos.
 */
export function Dialogo({
  abierto,
  titulo,
  children,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligroso = false,
  ocupado = false,
  alConfirmar,
  alCerrar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={() => abierto && alCerrar()}
      // text-left: en la tabla del listado el diálogo vive dentro de la celda «Acciones» (a la derecha).
      className="dialogo-panel bg-tarjeta text-tinta border-borde m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl border p-0 text-left"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id={idTitulo} className="titulo text-2xl">
          {titulo}
        </h2>
        {children ? <div className="text-tinta-suave">{children}</div> : null}
        {alConfirmar ? (
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" autoFocus className={BOTON_SECUNDARIO} onClick={alCerrar}>
              {textoCancelar}
            </button>
            <button
              type="button"
              disabled={ocupado}
              className={peligroso ? BOTON_PELIGRO : BOTON_PRIMARIO}
              onClick={alConfirmar}
            >
              {textoConfirmar}
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
