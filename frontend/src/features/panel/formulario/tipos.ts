import type { DatosComercialesAuto, DatosComercialesRepuesto, FotoApi } from "@/shared/api/tipos";

import type { EstadoArticulo } from "../articulos/tipos";

/** Espejo de `DetallePanelSerializer` y `ArticuloEscrituraSerializer` (serializers_panel.py). */

export type AutoDetalle = DatosComercialesAuto & {
  modelo: number;
  anio: number;
  version: string;
  kilometraje: number;
  transmision: number;
  combustible: number;
  traccion: number;
  carroceria: number;
  color_exterior: string;
  color_interior: string;
  cilindrada_cc: number | null;
  puertas: number;
  pasajeros: number;
  bolsas_aire: number;
  unico_dueno: boolean;
  procedencia: "agencia" | "importado";
  marchamo_al_dia: boolean;
  riteve_vence: string | null;
  impuestos_pagados: boolean;
  acepta_vehiculo: boolean;
  precio_negociable: boolean;
  estado_general: "excelente" | "muy_bueno" | "bueno" | "regular";
  placa_termina_en: number | null;
  equipamiento: number[];
};

export type CompatibilidadDetalle = {
  id?: number;
  modelo: number;
  anio_desde: number;
  anio_hasta: number;
  motor_version?: string | null;
};

export type RepuestoDetalle = DatosComercialesRepuesto & {
  categoria_pieza: number;
  condicion: "nuevo" | "usado";
  cantidad: number;
  codigo_interno: string | null;
  numero_parte: string;
  compatibilidades: CompatibilidadDetalle[];
};

export type DetallePanel = {
  id: number;
  tipo: "auto" | "repuesto";
  titulo: string;
  descripcion: string;
  precio_colones: number;
  precio_anterior_colones: number | null;
  destacado: boolean;
  estado: EstadoArticulo;
  publicado_en: string;
  actualizado_en: string;
  fotos: FotoApi[];
  auto: AutoDetalle | null;
  repuesto: RepuestoDetalle | null;
};

export type ArticuloEscritura = {
  tipo: "auto" | "repuesto";
  titulo: string;
  descripcion: string;
  precio_colones: number;
  precio_anterior_colones: number | null;
  destacado: boolean;
  auto?: AutoDetalle;
  repuesto?: Omit<RepuestoDetalle, "compatibilidades"> & {
    compatibilidades: Omit<CompatibilidadDetalle, "id">[];
  };
};
