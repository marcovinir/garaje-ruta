import type { Tarjeta } from "@/shared/api/tipos";

/** Espejo de `backend/apps/articulos/serializers_panel.py`. */

export type EstadoArticulo = "disponible" | "reservado" | "oculto" | "vendido";

export type FilaPanel = Tarjeta & {
  estado: EstadoArticulo;
  agotado: boolean;
  cantidad: number | null;
  destacado: boolean;
  fecha_venta: string | null;
  actualizado_en: string;
};
