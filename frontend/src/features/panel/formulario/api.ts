"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/api/navegador";
import type { Catalogos } from "@/shared/api/tipos";

import type { ArticuloEscritura, DetallePanel } from "./tipos";

export const CLAVE_CATALOGOS = ["catalogos"] as const;
export const claveDetalle = (id: number) => ["panel", "articulo", id] as const;

export function useCatalogos() {
  return useQuery({
    queryKey: CLAVE_CATALOGOS,
    queryFn: () => api<Catalogos>("/catalogos/"),
    staleTime: 5 * 60_000,
  });
}

export function useDetalle(id: number) {
  return useQuery({
    queryKey: claveDetalle(id),
    queryFn: () => api<DetallePanel>(`/panel/articulos/${id}/`),
  });
}

export const articulosApi = {
  crear: (cuerpo: ArticuloEscritura) =>
    api<DetallePanel>("/panel/articulos/", { metodo: "POST", cuerpo }),
  editar: (id: number, cuerpo: Partial<ArticuloEscritura>) =>
    api<DetallePanel>(`/panel/articulos/${id}/`, { metodo: "PATCH", cuerpo }),
};

export type TipoCatalogo = "marca" | "modelo" | "categoria";

export const catalogosApi = {
  crear: (tipo: TipoCatalogo, datos: { nombre: string; marca?: number; padre?: number | null }) => {
    const ruta = { marca: "marcas", modelo: "modelos", categoria: "categorias-pieza" }[tipo];
    return api<{ id: number; nombre: string }>(`/panel/${ruta}/`, {
      metodo: "POST",
      cuerpo: datos,
    });
  },
};
