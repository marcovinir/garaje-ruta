"use client";

import { useEffect } from "react";

/**
 * Suma una vista por artículo y sesión del navegador. Corre en el navegador, así que los bots
 * (que no ejecutan JavaScript) no inflan el conteo. Nunca bloquea ni muestra errores.
 */
export function ContadorVistas({ id }: { id: number }) {
  useEffect(() => {
    const clave = `vista-${id}`;
    try {
      if (sessionStorage.getItem(clave)) return;
      sessionStorage.setItem(clave, "1");
    } catch {
      return;
    }
    fetch(`/api/v1/vistas/${id}`, { method: "POST", keepalive: true }).catch(() => {});
  }, [id]);
  return null;
}
