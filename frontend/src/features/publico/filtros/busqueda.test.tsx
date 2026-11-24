import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Pagina, Tarjeta } from "@/shared/api/tipos";

vi.mock("@/shared/api/datos", () => ({ obtenerArticulos: vi.fn() }));

import * as datos from "@/shared/api/datos";

import { ResultadosBusqueda } from "./ResultadosBusqueda";

const tarjeta = (id: number, tipo: "auto" | "repuesto", titulo: string): Tarjeta => ({
  id,
  tipo,
  titulo,
  ruta: `/${tipo}s/x-${id}`,
  precio_colones: 100000,
  precio_anterior_colones: null,
  precio_usd: 220,
  foto: null,
  auto: null,
  repuesto: null,
});

const pagina = (results: Tarjeta[], count = results.length): Pagina<Tarjeta> => ({
  count,
  next: null,
  previous: null,
  results,
});

describe("ResultadosBusqueda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra autos y repuestos con enlace al listado filtrado", async () => {
    vi.mocked(datos.obtenerArticulos).mockImplementation(async (p) =>
      p.tipo === "auto"
        ? pagina([tarjeta(1, "auto", "Toyota Corolla 2015")], 12)
        : pagina([tarjeta(2, "repuesto", "Filtro de aceite Corolla")]),
    );
    render(await ResultadosBusqueda({ searchParams: Promise.resolve({ q: " corolla " }) }));
    expect(datos.obtenerArticulos).toHaveBeenCalledWith({ q: "corolla", tipo: "auto" });
    expect(datos.obtenerArticulos).toHaveBeenCalledWith({ q: "corolla", tipo: "repuesto" });
    expect(screen.getByRole("searchbox", { name: "Qué buscás" })).toHaveValue("corolla");
    expect(screen.getByRole("link", { name: /Toyota Corolla 2015/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver los 12 autos →" })).toHaveAttribute(
      "href",
      "/autos?q=corolla",
    );
    expect(screen.getByRole("link", { name: /Filtro de aceite/ })).toBeInTheDocument();
  });

  it("sin texto pide qué buscar y no consulta la API", async () => {
    render(await ResultadosBusqueda({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Escribí una marca, un modelo o una pieza/)).toBeInTheDocument();
    expect(datos.obtenerArticulos).not.toHaveBeenCalled();
  });

  it("avisa cuando no hay nada", async () => {
    vi.mocked(datos.obtenerArticulos).mockResolvedValue(pagina([]));
    render(await ResultadosBusqueda({ searchParams: Promise.resolve({ q: "zzz" }) }));
    expect(screen.getByText("No encontramos nada para «zzz».")).toBeInTheDocument();
  });

  it("si Django falla muestra un aviso", async () => {
    vi.mocked(datos.obtenerArticulos).mockRejectedValue(new Error("caído"));
    render(await ResultadosBusqueda({ searchParams: Promise.resolve({ q: "corolla" }) }));
    expect(screen.getByRole("status")).toHaveTextContent("No pudimos cargar");
  });
});
