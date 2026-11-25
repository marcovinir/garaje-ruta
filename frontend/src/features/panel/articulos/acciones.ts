import type { QueryClient } from "@tanstack/react-query";

import { api } from "@/shared/api/navegador";
import type { Pagina } from "@/shared/api/tipos";

import { CLAVE_ARTICULOS } from "./api";
import type { EstadoArticulo, FilaPanel } from "./tipos";

export const accionesApi = {
  cambiarEstado: (id: number, estado: EstadoArticulo) =>
    api<FilaPanel>(`/panel/articulos/${id}/estado/`, { metodo: "POST", cuerpo: { estado } }),
  vender: (id: number, cantidad = 1) =>
    api<{ venta_id: number; articulo: FilaPanel }>(`/panel/articulos/${id}/vender/`, {
      metodo: "POST",
      cuerpo: { cantidad },
    }),
  /** Con `ventaId` deshace esa venta; sin él, la última del artículo. */
  deshacerVenta: (id: number, ventaId?: number) =>
    api<FilaPanel>(`/panel/articulos/${id}/deshacer-venta/`, {
      metodo: "POST",
      cuerpo: ventaId === undefined ? undefined : { venta_id: ventaId },
    }),
  duplicar: (id: number) =>
    api<{ id: number }>(`/panel/articulos/${id}/duplicar/`, { metodo: "POST" }),
  eliminar: (id: number) => api<void>(`/panel/articulos/${id}/`, { metodo: "DELETE" }),
};

/** Pone la fila que devolvió Django en todas las páginas del listado en caché. */
export function reemplazarFila(qc: QueryClient, fila: FilaPanel) {
  qc.setQueriesData<Pagina<FilaPanel>>({ queryKey: CLAVE_ARTICULOS }, (pagina) =>
    pagina
      ? { ...pagina, results: pagina.results.map((f) => (f.id === fila.id ? fila : f)) }
      : pagina,
  );
}

/** Cambios de estado permitidos (§7; `TRANSICIONES` en backend/apps/articulos/services.py). */
export function transiciones(
  estado: EstadoArticulo,
): { estado: EstadoArticulo; etiqueta: string }[] {
  switch (estado) {
    case "disponible":
      return [
        { estado: "reservado", etiqueta: "Reservar" },
        { estado: "oculto", etiqueta: "Ocultar" },
      ];
    case "reservado":
      return [
        { estado: "disponible", etiqueta: "Quitar reserva" },
        { estado: "oculto", etiqueta: "Ocultar" },
      ];
    case "oculto":
      return [
        { estado: "disponible", etiqueta: "Publicar" },
        { estado: "reservado", etiqueta: "Reservar" },
      ];
    default:
      return [];
  }
}

export const A_LA_VENTA: EstadoArticulo[] = ["disponible", "reservado"];
