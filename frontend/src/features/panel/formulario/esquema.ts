import { z } from "zod";

import type { Catalogos } from "@/shared/api/tipos";

import { esFecha } from "../articulos/filtros";
import type { ArticuloEscritura, DetallePanel } from "./tipos";

/**
 * Valores del formulario como texto (lo que dan los `<input>`); `aEscritura` los convierte a lo
 * que espera `ArticuloEscrituraSerializer`. Los límites son los mismos que en Django.
 */

const ANIO_MINIMO = 1950;
const anioMaximo = () => new Date().getFullYear() + 1;
// Topes de las columnas de Postgres, iguales a los de Django (serializers_panel.py).
const ENTERO_MAX = 2_147_483_647;
const CHICO_MAX = 32_767;
const REQUERIDO = "Completá este campo.";

const requerido = (mensaje = REQUERIDO) => z.string().trim().min(1, mensaje);

function entero(
  minimo: number,
  {
    maximo,
    opcional = false,
    mensaje,
    tope = ENTERO_MAX,
  }: { maximo?: () => number; opcional?: boolean; mensaje?: string; tope?: number } = {},
) {
  return z
    .string()
    .trim()
    .refine(
      (v) => {
        if (v === "") return opcional;
        if (!/^\d+$/.test(v)) return false;
        const n = Number(v);
        return n >= minimo && (maximo === undefined || n <= maximo());
      },
      {
        message:
          mensaje ??
          (minimo > 0
            ? `Un número entero, ${minimo} o más.`
            : "Un número entero, sin puntos ni espacios."),
      },
    )
    .refine((v) => !/^\d+$/.test(v) || Number(v) <= tope, { message: "Es demasiado grande." });
}

const anio = () =>
  entero(ANIO_MINIMO, {
    maximo: anioMaximo,
    mensaje: `Un año entre ${ANIO_MINIMO} y ${anioMaximo()}.`,
  });

const textoOpcional = (maximo: number) =>
  z.string().trim().max(maximo, `Máximo ${maximo} caracteres.`);
const siNo = z.enum(["", "si", "no"]);
const conBateria = new Set(["Eléctrico", "Híbrido enchufable"]);

export function admiteDatosBateria(catalogos: Catalogos, combustible: string): boolean {
  const elegido = catalogos.combustibles.find((c) => String(c.id) === combustible);
  return elegido !== undefined && conBateria.has(elegido.nombre);
}

const camposBateria = {
  bateria_kwh: z
    .string()
    .trim()
    .refine(
      (v) => !v || (/^\d+(?:[.,]\d{1,2})?$/.test(v) && Number(v.replace(",", ".")) <= ENTERO_MAX),
      "Ingresá un número entre 0 y 2 147 483 647 con hasta dos decimales.",
    ),
  bateria_salud_pct: entero(0, {
    maximo: () => 100,
    opcional: true,
    mensaje: "Un número entero del 0 al 100.",
  }),
  autonomia_km: entero(0, { opcional: true }),
  tipo_carga: textoOpcional(80),
};
const esquemaBateria = z.object(camposBateria);

const esquemaAuto = z.object({
  marca: requerido("Elegí la marca."),
  modelo: requerido("Elegí el modelo."),
  anio: anio(),
  version: z.string().max(60, "Máximo 60 caracteres."),
  kilometraje: entero(0),
  transmision: requerido("Elegí una opción."),
  combustible: requerido("Elegí una opción."),
  traccion: requerido("Elegí una opción."),
  carroceria: requerido("Elegí una opción."),
  color_exterior: requerido().max(40, "Máximo 40 caracteres."),
  color_interior: z.string().max(40, "Máximo 40 caracteres."),
  cilindrada_cc: entero(0, { opcional: true }),
  puertas: entero(1, { tope: CHICO_MAX }),
  pasajeros: entero(1, { tope: CHICO_MAX }),
  bolsas_aire: entero(0, { tope: CHICO_MAX }),
  unico_dueno: z.boolean(),
  procedencia: z.enum(["agencia", "importado"]),
  marchamo_al_dia: z.boolean(),
  riteve_vence: z.string().refine((v) => v === "" || esFecha(v), "Fecha no válida."),
  impuestos_pagados: z.boolean(),
  acepta_vehiculo: z.boolean(),
  precio_negociable: z.boolean(),
  estado_general: z.enum(["excelente", "muy_bueno", "bueno", "regular"]),
  placa_termina_en: entero(0, {
    maximo: () => 9,
    opcional: true,
    mensaje: "Un dígito del 0 al 9.",
  }),
  equipamiento: z.array(z.string()),
  marchamo_anio: entero(ANIO_MINIMO, {
    maximo: anioMaximo,
    tope: CHICO_MAX,
    opcional: true,
    mensaje: `Un año entre ${ANIO_MINIMO} y ${anioMaximo()}.`,
  }),
  traspaso_incluido: siNo,
  financiamiento: siNo,
  sin_gravamenes: siNo,
  historial_mantenimiento: textoOpcional(250),
  historial_accidentes: textoOpcional(250),
  garantia: textoOpcional(250),
  bateria_kwh: z.string(),
  bateria_salud_pct: z.string(),
  autonomia_km: z.string(),
  tipo_carga: z.string(),
});

const esquemaCompatibilidad = z
  .object({
    marca: requerido("Elegí la marca."),
    modelo: requerido("Elegí el modelo."),
    anio_desde: anio(),
    anio_hasta: anio(),
    motor_version: textoOpcional(80),
  })
  .superRefine((c, ctx) => {
    if (/^\d+$/.test(c.anio_desde) && /^\d+$/.test(c.anio_hasta) && +c.anio_hasta < +c.anio_desde) {
      ctx.addIssue({
        code: "custom",
        path: ["anio_hasta"],
        message: "Tiene que ser igual o mayor que «desde».",
      });
    }
  });

const esquemaRepuesto = z.object({
  categoria_pieza: requerido("Elegí la categoría."),
  condicion: z.enum(["nuevo", "usado"]),
  cantidad: entero(0),
  codigo_interno: z.string().max(40, "Máximo 40 caracteres."),
  numero_parte: z.string().max(60, "Máximo 60 caracteres."),
  fabricante: textoOpcional(80),
  clasificacion: z.enum(["", "original", "oem", "generico"]),
  compatibilidades: z.array(esquemaCompatibilidad).min(1, "Agregá al menos una compatibilidad."),
});

export type ValoresAuto = z.infer<typeof esquemaAuto>;
export type ValoresRepuesto = z.infer<typeof esquemaRepuesto>;
export type ValoresFormulario = {
  tipo: "auto" | "repuesto";
  titulo: string;
  descripcion: string;
  precio_colones: string;
  precio_anterior_colones: string;
  destacado: boolean;
  auto: ValoresAuto;
  repuesto: ValoresRepuesto;
};

/** Esquema para el tipo del formulario; la otra parte (auto o repuesto) no se valida. */
export function esquemaArticulo(tipo: "auto" | "repuesto", catalogos?: Catalogos) {
  const auto = esquemaAuto.superRefine((valores, contexto) => {
    if (catalogos && !admiteDatosBateria(catalogos, valores.combustible)) return;
    const resultado = esquemaBateria.safeParse(valores);
    if (!resultado.success) {
      for (const error of resultado.error.issues) {
        contexto.addIssue({ code: "custom", path: error.path, message: error.message });
      }
    }
  });
  return z
    .object({
      tipo: z.enum(["auto", "repuesto"]),
      titulo: requerido().max(150, "Máximo 150 caracteres."),
      descripcion: z.string(),
      precio_colones: entero(0),
      precio_anterior_colones: entero(0, { opcional: true }),
      destacado: z.boolean(),
      auto: tipo === "auto" ? auto : z.any(),
      repuesto: tipo === "repuesto" ? esquemaRepuesto : z.any(),
    })
    .superRefine((v, ctx) => {
      const [precio, anterior] = [v.precio_colones, v.precio_anterior_colones].map((x) => x.trim());
      if (/^\d+$/.test(precio) && /^\d+$/.test(anterior) && +anterior <= +precio) {
        ctx.addIssue({
          code: "custom",
          path: ["precio_anterior_colones"],
          message: "Tiene que ser mayor que el precio actual.",
        });
      }
    });
}

export const compatibilidadVacia = () => ({
  marca: "",
  modelo: "",
  anio_desde: "",
  anio_hasta: "",
  motor_version: "",
});

export function valoresIniciales(tipo: "auto" | "repuesto"): ValoresFormulario {
  return {
    tipo,
    titulo: "",
    descripcion: "",
    precio_colones: "",
    precio_anterior_colones: "",
    destacado: false,
    auto: {
      marca: "",
      modelo: "",
      anio: "",
      version: "",
      kilometraje: "",
      transmision: "",
      combustible: "",
      traccion: "",
      carroceria: "",
      color_exterior: "",
      color_interior: "",
      cilindrada_cc: "",
      puertas: "4",
      pasajeros: "5",
      bolsas_aire: "2",
      unico_dueno: false,
      procedencia: "agencia",
      marchamo_al_dia: true,
      riteve_vence: "",
      impuestos_pagados: true,
      acepta_vehiculo: false,
      precio_negociable: false,
      estado_general: "bueno",
      placa_termina_en: "",
      equipamiento: [],
      marchamo_anio: "",
      traspaso_incluido: "",
      financiamiento: "",
      sin_gravamenes: "",
      historial_mantenimiento: "",
      historial_accidentes: "",
      garantia: "",
      bateria_kwh: "",
      bateria_salud_pct: "",
      autonomia_km: "",
      tipo_carga: "",
    },
    repuesto: {
      categoria_pieza: "",
      condicion: "nuevo",
      cantidad: "1",
      codigo_interno: "",
      numero_parte: "",
      fabricante: "",
      clasificacion: "",
      compatibilidades: [compatibilidadVacia()],
    },
  };
}

const numero = (v: string) => Number(v.trim());
const numeroONulo = (v: string) => (v.trim() === "" ? null : Number(v.trim()));

const booleanoONulo = (valor: ValoresAuto["financiamiento"]) =>
  valor === "" ? null : valor === "si";
const aSiNo = (valor?: boolean | null) => (valor == null ? "" : valor ? "si" : "no");

export function aEscritura(v: ValoresFormulario, catalogos?: Catalogos): ArticuloEscritura {
  const comunes = {
    tipo: v.tipo,
    titulo: v.titulo.trim(),
    descripcion: v.descripcion.trim(),
    precio_colones: numero(v.precio_colones),
    precio_anterior_colones: numeroONulo(v.precio_anterior_colones),
    destacado: v.destacado,
  };
  if (v.tipo === "auto") {
    // La marca solo sirve para elegir el modelo: Django no la recibe.
    const base: Omit<ValoresAuto, "marca"> & { marca?: string } = { ...v.auto };
    delete base.marca;
    const { bateria_kwh, bateria_salud_pct, autonomia_km, tipo_carga, ...a } = base;
    const bateria =
      !catalogos || admiteDatosBateria(catalogos, a.combustible)
        ? {
            bateria_kwh: numeroONulo(bateria_kwh.replace(",", ".")),
            bateria_salud_pct: numeroONulo(bateria_salud_pct),
            autonomia_km: numeroONulo(autonomia_km),
            tipo_carga: tipo_carga.trim() || null,
          }
        : {};
    return {
      ...comunes,
      auto: {
        ...a,
        modelo: numero(a.modelo),
        anio: numero(a.anio),
        version: a.version.trim(),
        kilometraje: numero(a.kilometraje),
        transmision: numero(a.transmision),
        combustible: numero(a.combustible),
        traccion: numero(a.traccion),
        carroceria: numero(a.carroceria),
        color_exterior: a.color_exterior.trim(),
        color_interior: a.color_interior.trim(),
        cilindrada_cc: numeroONulo(a.cilindrada_cc),
        puertas: numero(a.puertas),
        pasajeros: numero(a.pasajeros),
        bolsas_aire: numero(a.bolsas_aire),
        riteve_vence: a.riteve_vence || null,
        placa_termina_en: numeroONulo(a.placa_termina_en),
        equipamiento: a.equipamiento.map(Number).sort((x, y) => x - y),
        marchamo_anio: numeroONulo(a.marchamo_anio),
        traspaso_incluido: booleanoONulo(a.traspaso_incluido),
        financiamiento: booleanoONulo(a.financiamiento),
        sin_gravamenes: booleanoONulo(a.sin_gravamenes),
        historial_mantenimiento: a.historial_mantenimiento.trim() || null,
        historial_accidentes: a.historial_accidentes.trim() || null,
        garantia: a.garantia.trim() || null,
        ...bateria,
      },
    };
  }
  const r = v.repuesto;
  return {
    ...comunes,
    repuesto: {
      categoria_pieza: numero(r.categoria_pieza),
      condicion: r.condicion,
      cantidad: numero(r.cantidad),
      codigo_interno: r.codigo_interno.trim() || null,
      numero_parte: r.numero_parte.trim(),
      fabricante: r.fabricante.trim() || null,
      clasificacion: r.clasificacion || null,
      compatibilidades: r.compatibilidades.map((c) => ({
        modelo: numero(c.modelo),
        anio_desde: numero(c.anio_desde),
        anio_hasta: numero(c.anio_hasta),
        motor_version: c.motor_version.trim() || null,
      })),
    },
  };
}

function marcaDe(modelo: number, catalogos: Catalogos): string {
  const marca = catalogos.marcas.find((m) => m.modelos.some((mo) => mo.id === modelo));
  return marca ? String(marca.id) : "";
}

const texto = (n?: number | null) => (n == null ? "" : String(n));

export function desdeDetalle(d: DetallePanel, catalogos: Catalogos): ValoresFormulario {
  const base = valoresIniciales(d.tipo);
  const v: ValoresFormulario = {
    ...base,
    titulo: d.titulo,
    descripcion: d.descripcion,
    precio_colones: String(d.precio_colones),
    precio_anterior_colones: texto(d.precio_anterior_colones),
    destacado: d.destacado,
  };
  if (d.auto) {
    const a = d.auto;
    v.auto = {
      ...a,
      marca: marcaDe(a.modelo, catalogos),
      modelo: String(a.modelo),
      anio: String(a.anio),
      kilometraje: String(a.kilometraje),
      transmision: String(a.transmision),
      combustible: String(a.combustible),
      traccion: String(a.traccion),
      carroceria: String(a.carroceria),
      cilindrada_cc: texto(a.cilindrada_cc),
      puertas: String(a.puertas),
      pasajeros: String(a.pasajeros),
      bolsas_aire: String(a.bolsas_aire),
      riteve_vence: a.riteve_vence ?? "",
      placa_termina_en: texto(a.placa_termina_en),
      equipamiento: a.equipamiento.map(String),
      marchamo_anio: texto(a.marchamo_anio),
      traspaso_incluido: aSiNo(a.traspaso_incluido),
      financiamiento: aSiNo(a.financiamiento),
      sin_gravamenes: aSiNo(a.sin_gravamenes),
      historial_mantenimiento: a.historial_mantenimiento ?? "",
      historial_accidentes: a.historial_accidentes ?? "",
      garantia: a.garantia ?? "",
      bateria_kwh: texto(a.bateria_kwh),
      bateria_salud_pct: texto(a.bateria_salud_pct),
      autonomia_km: texto(a.autonomia_km),
      tipo_carga: a.tipo_carga ?? "",
    };
  }
  if (d.repuesto) {
    const r = d.repuesto;
    v.repuesto = {
      categoria_pieza: String(r.categoria_pieza),
      condicion: r.condicion,
      cantidad: String(r.cantidad),
      codigo_interno: r.codigo_interno ?? "",
      numero_parte: r.numero_parte,
      fabricante: r.fabricante ?? "",
      clasificacion: r.clasificacion ?? "",
      compatibilidades: r.compatibilidades.map((c) => ({
        marca: marcaDe(c.modelo, catalogos),
        modelo: String(c.modelo),
        anio_desde: String(c.anio_desde),
        anio_hasta: String(c.anio_hasta),
        motor_version: c.motor_version ?? "",
      })),
    };
  }
  return v;
}

/** Para editar (PATCH): solo las claves que cambiaron; auto o repuesto se mandan enteros. */
export function cambios(
  antes: ArticuloEscritura,
  despues: ArticuloEscritura,
): Partial<ArticuloEscritura> {
  const resultado: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(despues)) {
    if (clave === "tipo") continue;
    if (JSON.stringify(valor) !== JSON.stringify(antes[clave as keyof ArticuloEscritura])) {
      resultado[clave] = valor;
    }
  }
  return resultado as Partial<ArticuloEscritura>;
}
