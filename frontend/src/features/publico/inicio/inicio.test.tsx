import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Catalogos, Pagina, Tarjeta } from "@/shared/api/tipos";

vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/shared/api/datos", () => ({
  obtenerArticulos: vi.fn(),
  obtenerDestacados: vi.fn(),
  obtenerCatalogos: vi.fn(),
}));

import * as datos from "@/shared/api/datos";

import { Accesos, Carrocerias, Destacados, Ofertas } from "./secciones";

const tarjeta = (id: number, titulo: string, anterior: number | null = null): Tarjeta => ({
  id,
  tipo: "auto",
  titulo,
  ruta: `/autos/x-${id}`,
  precio_colones: 6500000,
  precio_anterior_colones: anterior,
  precio_usd: 14500,
  foto: null,
  auto: { anio: 2018, kilometraje: 82000, transmision: "Automática", combustible: "Gasolina" },
  repuesto: null,
});

const pagina = (results: Tarjeta[], count = results.length): Pagina<Tarjeta> => ({
  count,
  next: null,
  previous: null,
  results,
});

describe("inicio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra ofertas y destacados", async () => {
    vi.mocked(datos.obtenerArticulos).mockResolvedValue(pagina([tarjeta(1, "Corolla", 7200000)]));
    vi.mocked(datos.obtenerDestacados).mockResolvedValue([tarjeta(2, "RAV4"), tarjeta(3, "Swift")]);
    render(
      <>
        {await Ofertas()}
        {await Destacados()}
      </>,
    );
    expect(screen.getByRole("heading", { name: "Ofertas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recién llegados" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Corolla/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Swift/ })).toBeInTheDocument();
    expect(datos.obtenerArticulos).toHaveBeenCalledWith({ ofertas: "1", tipo: "auto" });
  });

  it("muestra las carrocerías como accesos al listado", async () => {
    vi.mocked(datos.obtenerCatalogos).mockResolvedValue({
      carrocerias: [{ id: 1, nombre: "SUV", slug: "suv" }],
    } as Catalogos);
    render(await Carrocerias());
    expect(screen.getByRole("link", { name: "SUV" })).toHaveAttribute(
      "href",
      "/autos?carroceria=suv",
    );
  });

  it("cuenta autos y repuestos disponibles", async () => {
    vi.mocked(datos.obtenerArticulos)
      .mockResolvedValueOnce(pagina([], 34))
      .mockResolvedValueOnce(pagina([], 70));
    render(await Accesos());
    expect(screen.getByRole("link", { name: /Autos.*34 disponibles/ })).toHaveAttribute(
      "href",
      "/autos",
    );
    expect(screen.getByRole("link", { name: /Repuestos.*70 en stock/ })).toBeInTheDocument();
  });

  it("si Django falla, la sección muestra un mensaje y no rompe la página", async () => {
    vi.mocked(datos.obtenerDestacados).mockRejectedValue(new Error("caído"));
    render(await Destacados());
    expect(screen.getByRole("status")).toHaveTextContent("No pudimos cargar");
  });
});
