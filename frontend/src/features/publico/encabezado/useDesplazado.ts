"use client";

import { useSyncExternalStore } from "react";

// Histéresis: el encabezado compacto mide ≈ 55 px menos. Si compactar y expandir usaran el mismo
// umbral, el ajuste de desplazamiento del navegador (scroll anchoring) lo haría oscilar sin fin.
const COMPACTAR_DESDE = 120;
const EXPANDIR_HASTA = 8;

export function siguienteCompacto(compacto: boolean, scrollY: number): boolean {
  return compacto ? scrollY >= EXPANDIR_HASTA : scrollY > COMPACTAR_DESDE;
}

let compactoActual = false;

function suscribir(avisar: () => void) {
  const alDesplazar = () => {
    const nuevo = siguienteCompacto(compactoActual, window.scrollY);
    if (nuevo !== compactoActual) {
      compactoActual = nuevo;
      avisar();
    }
  };
  alDesplazar();
  window.addEventListener("scroll", alDesplazar, { passive: true });
  return () => window.removeEventListener("scroll", alDesplazar);
}

/** true cuando la página bajó: el encabezado se compacta (#115). */
export function useDesplazado(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => compactoActual,
    () => false,
  );
}
