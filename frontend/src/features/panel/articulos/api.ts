"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/shared/api/navegador";
import type { Pagina, TipoCambio } from "@/shared/api/tipos";

import type { FiltrosPanel } from "./filtros";
import type { FilaPanel } from "./tipos";

export const CLAVE_ARTICULOS = ["panel", "articulos"] as const;

export function useArticulos(filtros: FiltrosPanel) {
  return useQuery({
    queryKey: [...CLAVE_ARTICULOS, filtros],
    queryFn: () => api<Pagina<FilaPanel>>("/panel/articulos/", { query: filtros }),
    placeholderData: keepPreviousData,
  });
}

export function useTipoCambio() {
  return useQuery({
    queryKey: ["tipo-cambio"],
    queryFn: () => api<TipoCambio>("/tipo-cambio/"),
    staleTime: 60 * 60_000,
  });
}
