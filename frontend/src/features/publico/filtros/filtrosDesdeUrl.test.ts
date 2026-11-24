import { describe, expect, it } from "vitest";

import { aQueryString, filtrosDesdeUrl, hrefSin } from "./filtrosDesdeUrl";

describe("filtrosDesdeUrl", () => {
  it("conserva los filtros válidos de un enlace compartido", () => {
    expect(
      filtrosDesdeUrl(
        { marca: "3", anio_min: "2015", equipamiento: "1,4", orden: "precio_asc" },
        "auto",
      ),
    ).toEqual({ marca: "3", anio_min: "2015", equipamiento: "1,4", orden: "precio_asc" });
  });

  it("descarta valores inválidos, vacíos y parámetros desconocidos", () => {
    expect(
      filtrosDesdeUrl(
        { anio_min: "abc", foo: "1", marca: "", modelo: "-2", orden: "raro", page: "0" },
        "auto",
      ),
    ).toEqual({});
  });

  it("en repuestos descarta los filtros de autos", () => {
    expect(
      filtrosDesdeUrl(
        { km_max: "90000", categoria: "frenos", condicion: "nuevo", compatible_anio: "2012" },
        "repuesto",
      ),
    ).toEqual({ categoria: "frenos", condicion: "nuevo", compatible_anio: "2012" });
  });

  it("une las casillas repetidas del formulario y quita ids basura o duplicados", () => {
    expect(filtrosDesdeUrl({ equipamiento: ["4", "1", "x", "4"] }, "auto")).toEqual({
      equipamiento: "1,4",
    });
  });

  it("toma el primer valor si un parámetro simple viene repetido y recorta la búsqueda", () => {
    expect(filtrosDesdeUrl({ marca: ["3", "5"], q: "  corolla  " }, "auto")).toEqual({
      marca: "3",
      q: "corolla",
    });
  });

  it("solo acepta slugs con letras, números y guiones", () => {
    expect(filtrosDesdeUrl({ carroceria: "suv" }, "auto")).toEqual({ carroceria: "suv" });
    expect(filtrosDesdeUrl({ carroceria: "<script>" }, "auto")).toEqual({});
  });
});

describe("aQueryString y hrefSin", () => {
  it("arma la query en orden estable", () => {
    expect(aQueryString({ orden: "precio_asc", marca: "3" })).toBe("?marca=3&orden=precio_asc");
    expect(aQueryString({})).toBe("");
  });

  it("quita un filtro y vuelve a la primera página", () => {
    expect(hrefSin("/autos", { marca: "3", anio_min: "2015", page: "2" }, "marca")).toBe(
      "/autos?anio_min=2015",
    );
  });

  it("quita un solo elemento de una lista", () => {
    expect(hrefSin("/autos", { equipamiento: "1,4" }, "equipamiento", "4")).toBe(
      "/autos?equipamiento=1",
    );
    expect(hrefSin("/autos", { equipamiento: "4" }, "equipamiento", "4")).toBe("/autos");
  });
});
