"use client";

import { useEffect } from "react";

/** Al salir del panel quita el modo de <html>, para que la web pública no lo herede. */
export function TemaPanel() {
  useEffect(
    () => () => {
      delete document.documentElement.dataset.tema;
    },
    [],
  );
  return null;
}
