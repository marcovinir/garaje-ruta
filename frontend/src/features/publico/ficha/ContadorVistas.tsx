"use client";

import { useEffect, useRef } from "react";

import { registrarEvento } from "@/shared/lib/eventos";

/**
 * Suma una vista por artículo y sesión del navegador. Corre en el navegador, así que los bots
 * (que no ejecutan JavaScript) no inflan el conteo. Nunca bloquea ni muestra errores.
 */
export function ContadorVistas({ id, tipo }: { id: number; tipo: "auto" | "repuesto" }) {
  const ultimaVista = useRef<number | null>(null);
  useEffect(() => {
    if (ultimaVista.current === id) return;
    ultimaVista.current = id;
    registrarEvento(tipo === "auto" ? "vehicle_view" : "part_view", {
      articulo: id,
      contexto: { pagina: tipo === "auto" ? "ficha_auto" : "ficha_repuesto", seccion: "ficha" },
    });
  }, [id, tipo]);

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
