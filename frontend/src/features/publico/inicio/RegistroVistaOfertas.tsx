"use client";

import { useEffect } from "react";

import { registrarEvento } from "@/shared/lib/eventos";

export function RegistroVistaOfertas({ tituloId }: { tituloId: string }) {
  useEffect(() => {
    const titulo = document.getElementById(tituloId);
    if (!titulo || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        observador.disconnect();
        registrarEvento("offer_view", { contexto: { pagina: "inicio", seccion: "ofertas" } });
      }
    });
    observador.observe(titulo);
    return () => observador.disconnect();
  }, [tituloId]);

  return null;
}
