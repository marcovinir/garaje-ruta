"use client";

import { useTema } from "./tema";

// Luna en modo claro (lleva al oscuro) y sol en modo oscuro (lleva al claro).
const LUNA = "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z";
const SOL =
  "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4";

/**
 * Interruptor sol/luna del modo oscuro (#113). `compacto`: solo el ícono (barra del celular);
 * si no, ícono y texto, como los ítems del menú lateral. `claseTexto` oculta el texto con la
 * barra plegada.
 */
export function InterruptorTema({
  compacto = false,
  claseTexto = "",
}: {
  compacto?: boolean;
  claseTexto?: string;
}) {
  const { tema, alternar } = useTema();
  const oscuro = tema === "oscuro";
  const etiqueta = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  const icono = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={oscuro ? SOL : LUNA} />
    </svg>
  );

  if (compacto) {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-label={etiqueta}
        title={etiqueta}
        className="text-tinta-suave hover:bg-campo hover:text-tinta inline-flex size-11 items-center justify-center rounded-xl"
      >
        {icono}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={etiqueta}
      title={etiqueta}
      className="text-tinta-suave hover:bg-campo hover:text-tinta flex min-h-11 w-full items-center gap-3 rounded-xl px-3 font-semibold"
    >
      {icono}
      <span aria-hidden="true" className={claseTexto}>
        {oscuro ? "Modo claro" : "Modo oscuro"}
      </span>
    </button>
  );
}
