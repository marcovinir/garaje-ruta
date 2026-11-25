import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Tarjeta } from "@/shared/api/tipos";

import { BotonWhatsapp } from "./BotonWhatsapp";
import { EtiquetaEstado } from "./EtiquetaEstado";
import { MensajeError } from "./MensajeError";
import { PieDePagina, resumirHorarios } from "./PieDePagina";
import { Precio } from "./Precio";
import { TarjetaArticulo } from "./TarjetaArticulo";

const auto: Tarjeta = {
  id: 12,
  tipo: "auto",
  titulo: "Toyota Corolla 2018 SE",
  ruta: "/autos/toyota-corolla-2018-se-12",
  precio_colones: 6500000,
  precio_anterior_colones: 7200000,
  precio_usd: 14500,
  foto: { public_id: "garaje-ruta/ejemplo/auto-01", ancho: 1448, alto: 1086 },
  auto: { anio: 2018, kilometraje: 82000, transmision: "Automática", combustible: "Gasolina" },
  repuesto: null,
};

const repuesto: Tarjeta = {
  ...auto,
  id: 40,
  tipo: "repuesto",
  titulo: "Batería 12 V 60 Ah",
  ruta: "/repuestos/bateria-12-v-60-ah-40",
  precio_colones: 42000,
  precio_anterior_colones: null,
  precio_usd: 90,
  auto: null,
  repuesto: {
    condicion: "usado",
    categoria: "Batería",
    compatibilidad_resumen: "Corolla 2012–2016 y 2 más",
  },
};

describe("Precio", () => {
  it("muestra el dólar después (debajo) del colón", () => {
    const { container } = render(<Precio colones={6500000} dolares={14500} />);
    const textos = Array.from(container.querySelectorAll("span")).map((s) => s.textContent);
    const iColones = textos.indexOf("₡6 500 000");
    const iDolares = textos.indexOf("≈ US$14 500");
    expect(iColones).toBeGreaterThanOrEqual(0);
    expect(iDolares).toBeGreaterThan(iColones);
  });

  it("sin tipo de cambio no muestra dólares; con anterior lo tacha arriba", () => {
    render(<Precio colones={6500000} dolares={null} anterior={7200000} />);
    expect(screen.queryByText(/US\$/)).toBeNull();
    expect(screen.getByText("Antes ₡7 200 000")).toBeInTheDocument();
  });
});

describe("TarjetaArticulo", () => {
  it("auto en oferta: enlace a su ruta, etiqueta y datos clave", () => {
    render(<TarjetaArticulo tarjeta={auto} />);
    const enlace = screen.getByRole("link", { name: /Toyota Corolla 2018 SE/ });
    expect(enlace).toHaveAttribute("href", "/autos/toyota-corolla-2018-se-12");
    expect(within(enlace).getByText("OFERTA")).toBeInTheDocument();
    expect(
      within(enlace).getByText("2018 · 82 000 km · Automática · Gasolina"),
    ).toBeInTheDocument();
    expect(within(enlace).getByRole("img")).toHaveAttribute("alt", "Toyota Corolla 2018 SE");
  });

  it("repuesto: condición y compatibilidad, sin etiqueta de oferta", () => {
    render(<TarjetaArticulo tarjeta={repuesto} />);
    expect(screen.getByText("Usado · Corolla 2012–2016 y 2 más")).toBeInTheDocument();
    expect(screen.queryByText("OFERTA")).toBeNull();
  });
});

describe("otros componentes", () => {
  it("BotonWhatsapp abre wa.me con el mensaje", () => {
    render(
      <BotonWhatsapp numero="50688887777" titulo="Toyota Corolla" url="https://x.test/autos/a-1" />,
    );
    const enlace = screen.getByRole("link", { name: /Consultar por WhatsApp/ });
    expect(enlace.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/50688887777\?text=Hola/);
  });

  it("EtiquetaEstado traduce el estado", () => {
    render(<EtiquetaEstado estado="reservado" />);
    expect(screen.getByText("Reservado")).toBeInTheDocument();
  });

  it("el pie (#contacto) deja lugar para el encabezado fijo al llegar desde «Contacto»", () => {
    const { container } = render(<PieDePagina configuracion={null} />);
    const pie = container.querySelector("footer#contacto");
    expect(pie?.className).toMatch(/scroll-mt-\d+/);
  });

  it("resumirHorarios agrupa días seguidos con la misma franja", () => {
    const h = (dia_semana: number, apertura: string, cierre: string) => ({
      dia_semana,
      apertura,
      cierre,
    });
    expect(
      resumirHorarios(
        [0, 1, 2, 3, 4].map((d) => h(d, "08:00", "17:00")).concat(h(5, "08:00", "12:00")),
      ),
    ).toEqual(["Lunes a viernes · 08:00 a 17:00", "Sábado · 08:00 a 12:00"]);
  });

  it("MensajeError da un mensaje amable", () => {
    render(<MensajeError />);
    expect(screen.getByRole("status")).toHaveTextContent("No pudimos cargar");
  });
});
