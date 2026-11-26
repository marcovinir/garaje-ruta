/** Formas de las respuestas de la API pública de Django (Plan 2). */

export type FotoApi = { public_id: string; ancho: number; alto: number };

export type Tarjeta = {
  id: number;
  tipo: "auto" | "repuesto";
  titulo: string;
  ruta: string;
  estado_publico?: "disponible" | "reservado" | "agotado" | "vendido" | "no_disponible";
  precio_colones: number;
  precio_anterior_colones: number | null;
  precio_usd: number | null;
  foto: FotoApi | null;
  auto: {
    marca?: string;
    modelo?: string;
    nombre_vehiculo?: string;
    anio: number;
    kilometraje: number;
    transmision: string;
    combustible: string;
  } | null;
  repuesto: {
    condicion: "nuevo" | "usado";
    categoria: string;
    compatibilidad_resumen: string;
    cantidad?: number;
  } | null;
};

export type Pagina<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type DatosComercialesAuto = {
  marchamo_anio?: number | null;
  traspaso_incluido?: boolean | null;
  financiamiento?: boolean | null;
  sin_gravamenes?: boolean | null;
  historial_mantenimiento?: string | null;
  historial_accidentes?: string | null;
  garantia?: string | null;
  bateria_kwh?: number | null;
  bateria_salud_pct?: number | null;
  autonomia_km?: number | null;
  tipo_carga?: string | null;
};

export type ClasificacionRepuesto = "original" | "oem" | "generico";

export type DatosComercialesRepuesto = {
  fabricante?: string | null;
  clasificacion?: ClasificacionRepuesto | null;
};

export type FichaAuto = DatosComercialesAuto & {
  marca: string;
  modelo: string;
  nombre_vehiculo: string;
  anio: number;
  version: string;
  kilometraje: number;
  transmision: string;
  combustible: string;
  traccion: string;
  carroceria: string;
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
  equipamiento: { grupo: string; items: string[] }[];
};

export type FichaRepuesto = DatosComercialesRepuesto & {
  condicion: "nuevo" | "usado";
  categoria: { nombre: string; padre: string | null };
  cantidad: number;
  numero_parte: string;
  compatibilidades: {
    marca: string;
    modelo: string;
    anio_desde: number;
    anio_hasta: number;
    motor_version?: string | null;
  }[];
};

export type FichaCompleta = Omit<Tarjeta, "auto" | "repuesto"> & {
  estado_publico: "disponible" | "reservado";
  descripcion: string;
  publicado_en: string;
  fotos: FotoApi[];
  vistas_total: number;
  auto: FichaAuto | null;
  repuesto: FichaRepuesto | null;
};

export type FichaNoDisponible = {
  id: number;
  tipo: "auto" | "repuesto";
  estado_publico: "vendido" | "agotado" | "no_disponible";
  titulo?: string;
  ruta?: string;
};

export type Ficha = FichaCompleta | FichaNoDisponible;

export type CategoriaApi = { id: number; nombre: string; slug: string; hijas: CategoriaApi[] };

export type Catalogos = {
  marcas: {
    id: number;
    nombre: string;
    slug: string;
    modelos: { id: number; nombre: string; slug: string; nombre_vehiculo?: string }[];
  }[];
  categorias: CategoriaApi[];
  transmisiones: { id: number; nombre: string }[];
  combustibles: { id: number; nombre: string }[];
  tracciones: { id: number; nombre: string }[];
  carrocerias: { id: number; nombre: string; slug: string }[];
  equipamiento: { grupo: string; items: { id: number; nombre: string; filtrable: boolean }[] }[];
};

export type CondicionesComerciales = {
  garantia_repuestos?: string | null;
  condiciones_devolucion?: string | null;
  metodos_entrega?: string | null;
  metodos_pago?: string | null;
  condiciones_compra?: string | null;
};

export type PreguntaFrecuente = { pregunta: string; respuesta: string };
export type RedSocial = { red: string; url: string };

export type Configuracion = CondicionesComerciales & {
  preguntas_frecuentes?: PreguntaFrecuente[];
  redes_sociales?: RedSocial[];
  nombre: string;
  logo_public_id: string;
  whatsapp: string;
  direccion: string;
  mapa_url: string;
  horarios: { dia_semana: number; apertura: string; cierre: string }[];
};

export type TipoCambio = {
  fecha: string;
  compra: string;
  venta: string;
  fuente: string;
  desactualizado: boolean;
};

export type EntradaSitemap = { ruta: string; actualizado_en: string };

export function esFichaCompleta(ficha: Ficha): ficha is FichaCompleta {
  return ficha.estado_publico === "disponible" || ficha.estado_publico === "reservado";
}
