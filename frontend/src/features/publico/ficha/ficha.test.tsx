import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FichaCompleta, Tarjeta } from "@/shared/api/tipos";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
  useRouter: () => ({ push: vi.fn() }),
  unstable_rethrow: vi.fn((error: unknown) => {
    if (error instanceof Error && /^(NOT_FOUND|REDIRECT)/.test(error.message)) throw error;
  }),
}));
vi.mock("@/shared/api/datos", () => ({
  obtenerFicha: vi.fn(),
  obtenerSimilares: vi.fn(),
  obtenerConfiguracion: vi.fn(),
}));

import { permanentRedirect } from "next/navigation";

import * as datos from "@/shared/api/datos";

import { cargarFicha, metadataFicha } from "./cargar";
import { PaginaFicha } from "./PaginaFicha";

const similar = (id: number, titulo: string): Tarjeta => ({
  id,
  tipo: "auto",
  titulo,
  ruta: `/autos/x-${id}`,
  precio_colones: 6000000,
  precio_anterior_colones: null,
  precio_usd: 13400,
  foto: null,
  auto: { anio: 2017, kilometraje: 90000, transmision: "Manual", combustible: "Diésel" },
  repuesto: null,
});

const ficha: FichaCompleta = {
  id: 12,
  tipo: "auto",
  titulo: "Toyota Corolla 2015 SE",
  ruta: "/autos/toyota-corolla-2015-se-12",
  precio_colones: 6500000,
  precio_anterior_colones: null,
  precio_usd: 14500,
  foto: { public_id: "garaje-ruta/corolla", ancho: 1600, alto: 1200 },
  estado_publico: "disponible",
  descripcion: "Muy bien cuidado.",
  publicado_en: "2026-11-20T10:00:00-06:00",
  fotos: [{ public_id: "garaje-ruta/corolla", ancho: 1600, alto: 1200 }],
  vistas_total: 40,
  auto: {
    marca: "Toyota",
    modelo: "Corolla",
    anio: 2015,
    version: "SE",
    kilometraje: 82000,
    transmision: "Automática",
    combustible: "Gasolina",
    traccion: "4x2",
    carroceria: "Sedán",
    color_exterior: "Blanco",
    color_interior: "Negro",
    cilindrada_cc: 1800,
    puertas: 4,
    pasajeros: 5,
    bolsas_aire: 6,
    unico_dueno: true,
    procedencia: "agencia",
    marchamo_al_dia: true,
    riteve_vence: "2027-03-31",
    impuestos_pagados: true,
    acepta_vehiculo: false,
    precio_negociable: true,
    estado_general: "muy_bueno",
    placa_termina_en: 4,
    equipamiento: [{ grupo: "Confort", items: ["Aire acondicionado"] }],
  },
  repuesto: null,
};

describe("cargarFicha", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirige (308) una URL con el texto viejo a la canónica", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(ficha);
    await expect(cargarFicha("autos", "toyota-corolla-2015-12")).rejects.toThrow("REDIRECT");
    expect(permanentRedirect).toHaveBeenCalledWith("/autos/toyota-corolla-2015-se-12");
  });

  it("redirige si la sección no es la del artículo", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(ficha);
    await expect(cargarFicha("repuestos", "toyota-corolla-2015-se-12")).rejects.toThrow("REDIRECT");
  });

  it("devuelve la ficha si la URL es la canónica", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(ficha);
    await expect(cargarFicha("autos", "toyota-corolla-2015-se-12")).resolves.toBe(ficha);
  });

  it("un id que no existe, o una URL sin id, da 404", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(null);
    await expect(cargarFicha("autos", "algo-999")).rejects.toThrow("NOT_FOUND");
    await expect(cargarFicha("autos", "sin-numero")).rejects.toThrow("NOT_FOUND");
  });

  it("un artículo oculto (sin ruta) en otra sección da 404", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue({
      id: 5,
      tipo: "repuesto",
      estado_publico: "no_disponible",
    });
    await expect(cargarFicha("autos", "x-5")).rejects.toThrow("NOT_FOUND");
  });
});

describe("metadataFicha", () => {
  const nube = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD = "demo";
    process.env.SITIO_URL = "https://garaje.example";
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD = nube;
    delete process.env.SITIO_URL;
  });

  it("arma título, descripción con el precio, canónica y og:image 1200×630", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(ficha);
    const meta = await metadataFicha("toyota-corolla-2015-se-12");
    expect(meta.title).toBe("Toyota Corolla 2015 SE");
    expect(meta.description).toMatch(/₡6.500.000/);
    expect(meta.description).toMatch(/82.000 km/);
    expect(meta.alternates?.canonical).toBe(
      "https://garaje.example/autos/toyota-corolla-2015-se-12",
    );
    expect(meta.openGraph?.images).toEqual([
      {
        url: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1200,h_630,c_fill/garaje-ruta/corolla",
        width: 1200,
        height: 630,
        alt: "Toyota Corolla 2015 SE",
      },
    ]);
  });

  it("si Django no responde usa el título del sitio, no «no encontrado»", async () => {
    vi.mocked(datos.obtenerFicha).mockRejectedValue(new Error("caído"));
    expect(await metadataFicha("toyota-corolla-2015-se-12")).toEqual({});
  });

  it("sin Cloudinary no publica el marcador SVG como og:image", async () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD = "";
    vi.mocked(datos.obtenerFicha).mockResolvedValue(ficha);
    const meta = await metadataFicha("toyota-corolla-2015-se-12");
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it("un artículo vendido no se indexa", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue({
      id: 12,
      tipo: "auto",
      estado_publico: "vendido",
      titulo: "Toyota Corolla 2015 SE",
      ruta: "/autos/toyota-corolla-2015-se-12",
    });
    const meta = await metadataFicha("toyota-corolla-2015-se-12");
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("PaginaFicha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(datos.obtenerConfiguracion).mockResolvedValue({
      nombre: "Garaje Ruta",
      logo_public_id: "",
      whatsapp: "50688887777",
      direccion: "Heredia",
      mapa_url: "",
      horarios: [],
    });
    vi.mocked(datos.obtenerSimilares).mockResolvedValue([
      similar(1, "Hyundai Elantra 2016"),
      similar(2, "Nissan Sentra 2017"),
      similar(3, "Kia Rio 2018"),
    ]);
  });

  it("muestra la ficha completa con datos, equipamiento y WhatsApp", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(ficha);
    render(await PaginaFicha({ seccion: "autos", slug: "toyota-corolla-2015-se-12" }));
    expect(screen.getByRole("heading", { level: 1, name: "Toyota Corolla 2015 SE" })).toBeVisible();
    expect(screen.getByText("Kilometraje").nextSibling).toHaveTextContent(/82.000 km/);
    expect(screen.getByText("Aire acondicionado")).toBeInTheDocument();
    const whatsapp = screen.getAllByRole("link", { name: /Consultar por WhatsApp/ })[0];
    expect(whatsapp.getAttribute("href")).toContain("wa.me/50688887777");
  });

  it("un auto vendido dice que ya se vendió y ofrece 3 similares", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue({
      id: 12,
      tipo: "auto",
      estado_publico: "vendido",
      titulo: "Toyota Corolla 2015 SE",
      ruta: "/autos/toyota-corolla-2015-se-12",
    });
    render(await PaginaFicha({ seccion: "autos", slug: "toyota-corolla-2015-se-12" }));
    expect(screen.getByRole("heading", { level: 1, name: "Este auto ya se vendió" })).toBeVisible();
    expect(screen.getByText("Toyota Corolla 2015 SE")).toBeInTheDocument();
    const similares = screen.getByRole("region", { name: "Te pueden interesar" });
    expect(within(similares).getAllByRole("link")).toHaveLength(3);
  });

  it("si Django falla muestra un aviso dentro de la página", async () => {
    vi.mocked(datos.obtenerFicha).mockRejectedValue(new Error("caído"));
    render(await PaginaFicha({ seccion: "autos", slug: "toyota-corolla-2015-se-12" }));
    expect(screen.getByRole("status")).toHaveTextContent("No pudimos cargar este artículo");
  });

  it("deja pasar el 404 de Next aunque atrape los errores de Django", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(null);
    await expect(PaginaFicha({ seccion: "autos", slug: "x-999" })).rejects.toThrow("NOT_FOUND");
  });

  it("un artículo oculto no muestra ningún dato suyo", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue({
      id: 12,
      tipo: "auto",
      estado_publico: "no_disponible",
    });
    render(await PaginaFicha({ seccion: "autos", slug: "toyota-corolla-2015-se-12" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Este artículo ya no está disponible" }),
    ).toBeVisible();
    expect(screen.queryByText(/Corolla/)).not.toBeInTheDocument();
  });
  it("usa los datos del auto en ambas consultas y ofrece visita", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue(ficha);
    render(await PaginaFicha({ seccion: "autos", slug: "toyota-corolla-2015-se-12" }));
    for (const enlace of screen.getAllByRole("link", { name: /^Consultar/ })) {
      const mensaje = new URL(enlace.getAttribute("href")!).searchParams.get("text");
      expect(mensaje).toContain("Toyota Corolla 2015 publicado en ₡6 500 000");
      expect(mensaje).toContain(ficha.ruta);
    }
    expect(screen.getByRole("link", { name: "Agendar una visita" })).toBeInTheDocument();
  });
  it("usa disponibilidad y compatibilidad en la ficha de repuesto", async () => {
    vi.mocked(datos.obtenerFicha).mockResolvedValue({
      ...ficha,
      tipo: "repuesto",
      titulo: "Faro",
      ruta: "/repuestos/faro-12",
      auto: null,
      repuesto: {
        condicion: "usado",
        categoria: { nombre: "Faros", padre: null },
        cantidad: 2,
        numero_parte: "ABC",
        compatibilidades: [],
      },
    });
    render(await PaginaFicha({ seccion: "repuestos", slug: "faro-12" }));
    const consulta = screen.getByRole("link", { name: "Consultar por WhatsApp" });
    expect(new URL(consulta.getAttribute("href")!).searchParams.get("text")).toContain(
      "Quisiera conocer su disponibilidad.",
    );
    const compatibilidad = screen.getByRole("link", { name: "Confirmar compatibilidad" });
    expect(new URL(compatibilidad.getAttribute("href")!).searchParams.get("text")).toContain(
      "Número de parte: ABC",
    );
  });
});
