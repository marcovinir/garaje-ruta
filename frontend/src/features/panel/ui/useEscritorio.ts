"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(min-width: 1024px)";

function suscribir(avisar: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener("change", avisar);
  return () => lista.removeEventListener("change", avisar);
}

/** ¿Escritorio (≥ 1024 px)? Allí el listado es una tabla; en celular y tablet, tarjetas (§11). */
export function useEscritorio(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => Boolean(window.matchMedia?.(CONSULTA).matches),
    () => false,
  );
}
