"use client";

import { useSyncExternalStore } from "react";

const UMBRAL = 48;

function suscribir(avisar: () => void) {
  window.addEventListener("scroll", avisar, { passive: true });
  return () => window.removeEventListener("scroll", avisar);
}

/** true cuando la página bajó un poco: el encabezado se compacta (#115). */
export function useDesplazado(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.scrollY > UMBRAL,
    () => false,
  );
}
