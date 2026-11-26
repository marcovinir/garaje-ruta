import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Tarjeta } from "@/shared/api/tipos";
import { CATALOGOS } from "@/test/datos";

const { navegar, registrarEvento } = vi.hoisted(() => ({
  navegar: vi.fn(),
  registrarEvento: vi.fn(),
}));
vi.mock("@/shared/lib/eventos", async (importar) => ({
  ...(await importar<typeof import("@/shared/lib/eventos")>()),
  registrarEvento,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navegar }) }));
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/shared/api/datos", () => ({
  obtenerArticulos: vi.fn(),
  obtenerCatalogos: vi.fn(),
  obtenerConfiguracion: vi.fn(),
}));

import * as datos from "@/shared/api/datos";
import { Beneficios, Hero } from "./Hero";
import { Carrocerias, Compatibilidad, Ofertas, RecienLlegados, ResumenContacto } from "./secciones";

const tarjeta = (id: number, tipo: Tarjeta["tipo"], anterior: number | null = null): Tarjeta => ({
  id,
  tipo,
  titulo: tipo === "auto" ? "Toyota Corolla" : "Faro Corolla",
  ruta: `/${tipo === "auto" ? "autos" : "repuestos"}/modelo-${id}`,
  precio_colones: 100000,
  precio_anterior_colones: anterior,
  precio_usd: null,
  foto: null,
  auto:
    tipo === "auto"
      ? { anio: 2018, kilometraje: 82000, transmision: "Manual", combustible: "Gasolina" }
      : null,
  repuesto:
    tipo === "repuesto"
      ? { condicion: "usado", categoria: "Iluminación", compatibilidad_resumen: "Corolla" }
      : null,
});

describe("inicio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(datos.obtenerCatalogos).mockResolvedValue(CATALOGOS);
    vi.mocked(datos.obtenerConfiguracion).mockResolvedValue({
      nombre: "Garaje Ruta",
      logo_public_id: "",
      whatsapp: "50600000000",
      direccion: "Heredia, Costa Rica",
      mapa_url: "",
      horarios: [{ dia_semana: 0, apertura: "08:00", cierre: "17:00" }],
    });
    vi.mocked(datos.obtenerArticulos).mockImplementation(async ({ tipo, ofertas }) => ({
      count: 1,
      next: null,
      previous: null,
      results: [
        tarjeta(
          ofertas ? 1 : 2,
          tipo === "repuesto" ? "repuesto" : "auto",
          ofertas ? 120000 : null,
        ),
      ],
    }));
  });

  it("muestra el hero aprobado y conecta las secciones con el catálogo", async () => {
    render(
      <>
        <Hero />
        <Beneficios />
        {await Carrocerias()}
        {await Ofertas()}
        {await RecienLlegados({ tipo: "auto" })}
        {await RecienLlegados({ tipo: "repuesto" })}
        {await ResumenContacto()}
      </>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Autos usados y repuestos en Heredia" }),
    ).toBeVisible();
    expect(screen.getByText("PATIO DE AUTOS USADOS · HEREDIA")).toBeVisible();
    expect(
      screen.getByText(
        "Mirá fotos, precio y compatibilidad antes de venir. Consultá por WhatsApp.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Explorar autos" })).toHaveAttribute("href", "/autos");
    expect(screen.getByRole("link", { name: "Buscar repuestos" })).toHaveAttribute(
      "href",
      "/repuestos",
    );
    expect(
      within(screen.getByRole("list", { name: "Beneficios" }))
        .getAllByRole("listitem")
        .map((i) => i.textContent),
    ).toEqual([
      "Autos revisados",
      "Precios claros",
      "Compatibilidad de repuestos",
      "Atención por WhatsApp",
    ]);
    expect(screen.getByRole("link", { name: "Sedán" })).toHaveAttribute(
      "href",
      "/autos?carroceria=sedan",
    );
    expect(
      within(screen.getByRole("region", { name: "Ofertas" })).getByText("Ahorrás ₡20 000"),
    ).toBeVisible();
    for (const tipo of ["auto", "repuesto"]) {
      const plural = tipo + "s";
      const lista = within(
        screen.getByRole("region", { name: new RegExp(plural + " recién llegados", "i") }),
      );
      expect(
        lista.getByRole("link", { name: new RegExp("Ver todos los " + plural) }),
      ).toHaveAttribute("href", "/" + plural);
      expect(
        lista
          .getAllByRole("link")
          .filter((link) => link.getAttribute("href")?.startsWith("/" + plural + "/")),
      ).toHaveLength(1);
      expect(datos.obtenerArticulos).toHaveBeenCalledWith({
        tipo,
        orden: "recientes",
        tamano: "4",
      });
    }
    expect(screen.getByText("Lunes · 08:00 a 17:00")).toBeVisible();
  });

  it("limpia el modelo al cambiar de marca y envía los tres filtros existentes", async () => {
    const u = userEvent.setup();
    render(await Compatibilidad());
    const form = within(await screen.findByRole("form", { name: "Buscá repuestos compatibles" }));
    const marca = form.getByLabelText("Marca");
    const modelo = () => form.getByLabelText("Modelo");
    expect(modelo()).toBeDisabled();
    await u.selectOptions(marca, "13");
    await u.selectOptions(modelo(), "40");
    await u.selectOptions(marca, "15");
    expect(modelo()).toHaveValue("");
    expect(form.queryByRole("option", { name: "Corolla" })).not.toBeInTheDocument();
    await u.selectOptions(modelo(), "55");
    await u.type(form.getByLabelText("Año"), "2018");
    await u.click(form.getByRole("button", { name: "Buscar repuestos compatibles" }));
    expect(registrarEvento).toHaveBeenCalledWith("filter_applied", {
      contexto: {
        pagina: "inicio",
        seccion: "compatibilidad",
        filtros: ["compatible_marca", "compatible_modelo", "compatible_anio"],
      },
    });
    expect(navegar).toHaveBeenCalledWith(
      "/repuestos?compatible_marca=15&compatible_modelo=55&compatible_anio=2018",
    );
  });

  it("si Django falla, la sección muestra un mensaje", async () => {
    vi.mocked(datos.obtenerArticulos).mockRejectedValue(new Error("caído"));
    render(await RecienLlegados({ tipo: "auto" }));
    expect(screen.getByRole("status")).toHaveTextContent("No pudimos cargar");
  });
});
