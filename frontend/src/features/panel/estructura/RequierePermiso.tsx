"use client";

import type { ReactNode } from "react";

import { useSesion } from "../auth/useSesion";
import { SinAcceso } from "./SinAcceso";

/** Muestra el contenido solo con el permiso; si no, «No tenés acceso a esta sección». */
export function RequierePermiso({ codigo, children }: { codigo: string; children: ReactNode }) {
  const { cargando, puede } = useSesion();
  if (cargando) return null;
  return puede(codigo) ? children : <SinAcceso />;
}
