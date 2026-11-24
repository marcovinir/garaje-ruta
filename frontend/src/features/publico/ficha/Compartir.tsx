"use client";

import { useEffect, useState } from "react";

type Props = { titulo: string; url: string };

/** En el teléfono abre el menú de compartir; donde no existe, copia el enlace y lo anuncia. */
export function Compartir({ titulo, url }: Props) {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!mensaje) return;
    const temporizador = setTimeout(() => setMensaje(""), 4000);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        // La persona cerró el menú: no hay nada que avisar.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMensaje("Enlace copiado");
    } catch {
      setMensaje(`No se pudo copiar. El enlace es ${url}`);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={compartir}
        className="border-borde bg-tarjeta hover:border-tinta inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-semibold"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Compartir
      </button>
      <p role="status" className="text-tinta-suave min-h-5 text-center text-sm">
        {mensaje}
      </p>
    </div>
  );
}
