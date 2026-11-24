"use client";

import { useCallback } from "react";

import { useYo } from "./api";

/** La sesión y sus permisos. El panel oculta lo que no se puede; la API igual lo rechaza. */
export function useSesion() {
  const { data, isPending } = useYo();
  const yo = data ?? null;
  const puede = useCallback((codigo: string) => Boolean(yo?.permisos.includes(codigo)), [yo]);
  return { yo, cargando: isPending, puede };
}
