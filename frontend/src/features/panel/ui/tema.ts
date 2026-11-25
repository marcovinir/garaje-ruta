"use client";

import { useCallback, useSyncExternalStore } from "react";

import { CLAVE_TEMA } from "./scriptTema";

export { CLAVE_TEMA, SCRIPT_TEMA } from "./scriptTema";

/** Modo del panel (#113). Se guarda en el navegador; sin elección, sigue al sistema. */
export type Tema = "claro" | "oscuro";

const esTema = (v: unknown): v is Tema => v === "claro" || v === "oscuro";

export function leerPreferencia(): Tema | null {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return esTema(valor) ? valor : null;
  } catch {
    return null;
  }
}

export function temaInicial(): Tema {
  const guardado = leerPreferencia();
  if (guardado) return guardado;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema;
}

export function guardarTema(tema: Tema): void {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Sin almacenamiento (navegación privada, datos bloqueados): vale solo para esta pestaña.
  }
}

// El tema vive en el atributo de <html>: todos los interruptores lo leen de ahí y se enteran de
// los cambios con un MutationObserver.
function suscribir(avisar: () => void) {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, { attributeFilter: ["data-tema"] });
  return () => observador.disconnect();
}
const leerActual = (): Tema =>
  document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro";

export function useTema(): { tema: Tema; alternar: () => void } {
  const tema = useSyncExternalStore(suscribir, leerActual, () => "claro" as const);
  const alternar = useCallback(() => {
    const nuevo: Tema = leerActual() === "oscuro" ? "claro" : "oscuro";
    aplicarTema(nuevo);
    guardarTema(nuevo);
  }, []);
  return { tema, alternar };
}
