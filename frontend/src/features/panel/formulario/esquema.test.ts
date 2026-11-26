import { describe, expect, it } from "vitest";

import { CATALOGOS } from "@/test/datos";

import { aEscritura, desdeDetalle, esquemaArticulo, valoresIniciales } from "./esquema";
import type { DetallePanel } from "./tipos";

const autoValido = () => {
  const v = valoresIniciales("auto");
  v.titulo = "Toyota Corolla 2015";
  v.precio_colones = "6500000";
  v.auto = {
    ...v.auto,
    marca: "13",
    modelo: "40",
    anio: "2015",
    kilometraje: "82000",
    transmision: "2",
    combustible: "1",
    traccion: "1",
    carroceria: "1",
    color_exterior: "Blanco",
    equipamiento: ["1"],
  };
  return v;
};

const errores = (v: unknown, tipo: "auto" | "repuesto") => {
  const r = esquemaArticulo(tipo).safeParse(v);
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("esquema del formulario", () => {
  it("un auto válido pasa y se convierte a lo que espera Django (ids y números)", () => {
    const v = autoValido();
    expect(errores(v, "auto")).toEqual({});
    const escritura = aEscritura(v);
    expect(escritura).toMatchObject({
      tipo: "auto",
      titulo: "Toyota Corolla 2015",
      precio_colones: 6500000,
      precio_anterior_colones: null,
      auto: {
        modelo: 40,
        anio: 2015,
        kilometraje: 82000,
        transmision: 2,
        cilindrada_cc: null,
        placa_termina_en: null,
        riteve_vence: null,
        equipamiento: [1],
      },
    });
    expect(escritura.auto).not.toHaveProperty("marca");
    expect(escritura).not.toHaveProperty("repuesto");
  });

  it("el precio anterior tiene que ser mayor que el actual", () => {
    const v = { ...autoValido(), precio_anterior_colones: "6500000" };
    expect(errores(v, "auto")).toEqual({
      precio_anterior_colones: "Tiene que ser mayor que el precio actual.",
    });
  });

  it("año, placa y números fuera de rango", () => {
    const v = autoValido();
    v.auto = { ...v.auto, anio: "1949", placa_termina_en: "12", kilometraje: "-5" };
    expect(Object.keys(errores(v, "auto")).sort()).toEqual([
      "auto.anio",
      "auto.kilometraje",
      "auto.placa_termina_en",
    ]);
  });

  it("los números enormes se rechazan con el mismo tope que Django", () => {
    const v = { ...autoValido(), precio_colones: "10000000000" };
    v.auto = { ...v.auto, kilometraje: "2147483648", puertas: "32768" };
    expect(errores(v, "auto")).toEqual({
      precio_colones: "Es demasiado grande.",
      "auto.kilometraje": "Es demasiado grande.",
      "auto.puertas": "Es demasiado grande.",
    });
    v.precio_colones = "2147483647";
    v.auto = { ...v.auto, kilometraje: "2147483647", puertas: "32767" };
    expect(errores(v, "auto")).toEqual({});
  });

  it("un repuesto necesita al menos una compatibilidad con años en orden", () => {
    const v = valoresIniciales("repuesto");
    v.titulo = "Pastillas";
    v.precio_colones = "25000";
    v.repuesto = { ...v.repuesto, categoria_pieza: "2", cantidad: "3", compatibilidades: [] };
    expect(errores(v, "repuesto")).toEqual({
      "repuesto.compatibilidades": "Agregá al menos una compatibilidad.",
    });
    v.repuesto.compatibilidades = [
      { marca: "13", modelo: "40", anio_desde: "2016", anio_hasta: "2012", motor_version: "" },
    ];
    expect(errores(v, "repuesto")).toEqual({
      "repuesto.compatibilidades.0.anio_hasta": "Tiene que ser igual o mayor que «desde».",
    });
  });

  it("respeta topes, distingue No de sin dato y admite coma decimal para kWh", () => {
    const v = autoValido();
    const esquema = esquemaArticulo("auto", CATALOGOS);
    v.auto = {
      ...v.auto,
      combustible: "3",
      marchamo_anio: "32768",
      bateria_kwh: "2147483648",
      autonomia_km: "2147483648",
      bateria_salud_pct: "101",
    };
    const resultado = esquema.safeParse(v);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.map((error) => error.path.join("."))).toEqual(
        expect.arrayContaining([
          "auto.marchamo_anio",
          "auto.bateria_kwh",
          "auto.autonomia_km",
          "auto.bateria_salud_pct",
        ]),
      );
    }
    v.auto = {
      ...v.auto,
      marchamo_anio: "",
      bateria_kwh: "42,75",
      autonomia_km: "2147483647",
      bateria_salud_pct: "0",
      traspaso_incluido: "no",
      financiamiento: "si",
    };
    expect(esquema.safeParse(v).success).toBe(true);
    expect(aEscritura(v, CATALOGOS).auto).toMatchObject({
      marchamo_anio: null,
      bateria_kwh: 42.75,
      autonomia_km: 2147483647,
      bateria_salud_pct: 0,
      traspaso_incluido: false,
      financiamiento: true,
      sin_gravamenes: null,
    });
    v.auto.combustible = "5";
    v.auto.bateria_salud_pct = "101";
    expect(esquema.safeParse(v).success).toBe(true);
    expect(aEscritura(v, CATALOGOS).auto).not.toHaveProperty("bateria_salud_pct");
  });

  it("desdeDetalle reconstruye la marca a partir del modelo", () => {
    const detalle: DetallePanel = {
      id: 7,
      tipo: "repuesto",
      titulo: "Pastillas",
      descripcion: "",
      precio_colones: 25000,
      precio_anterior_colones: null,
      destacado: false,
      estado: "disponible",
      publicado_en: "2026-11-01T10:00:00-06:00",
      actualizado_en: "2026-11-01T10:00:00-06:00",
      fotos: [],
      auto: null,
      repuesto: {
        categoria_pieza: 2,
        condicion: "nuevo",
        cantidad: 3,
        codigo_interno: null,
        numero_parte: "",
        compatibilidades: [{ id: 1, modelo: 55, anio_desde: 2010, anio_hasta: 2014 }],
      },
    };
    const v = desdeDetalle(detalle, CATALOGOS);
    expect(v.repuesto.compatibilidades).toEqual([
      { marca: "15", modelo: "55", anio_desde: "2010", anio_hasta: "2014", motor_version: "" },
    ]);
    expect(v.repuesto.codigo_interno).toBe("");
    expect(v.precio_colones).toBe("25000");
  });
});
