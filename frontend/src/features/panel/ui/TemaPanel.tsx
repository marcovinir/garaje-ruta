"use client";

import { useEffect } from "react";

import { aplicarTema, temaInicial } from "./tema";

/**
 * Al entrar al panel aplica el modo (también al volver por navegación del cliente, donde el script
 * en línea no corre) y al salir lo quita, para que la web pública no lo herede. Aplicarlo al montar
 * hace que el ciclo montar-desmontar-montar del modo estricto de React no lo pierda.
 */
export function TemaPanel() {
  useEffect(() => {
    aplicarTema(temaInicial());
    return () => {
      delete document.documentElement.dataset.tema;
    };
  }, []);
  return null;
}
