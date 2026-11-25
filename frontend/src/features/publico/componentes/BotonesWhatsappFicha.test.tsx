import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import {
  enlaceConsultaAuto,
  enlaceVisitaAuto,
  enlaceConsultaRepuesto,
  enlaceCompatibilidadRepuesto,
} from "@/shared/lib/whatsapp";
import { BotonesWhatsappFicha } from "./BotonesWhatsappFicha";
const numero = "50688887777";
const auto = {
  marca: "Toyota",
  modelo: "Corolla",
  anio: 2018,
  precio: 6500000,
  url: "https://garaje.test/autos/corolla-1",
};
const repuesto = {
  nombre: "Faro",
  precio: 85000,
  numeroParte: "ABC",
  url: "https://garaje.test/repuestos/faro-2",
};
it.each([
  {
    tipo: "auto" as const,
    secundario: "Agendar una visita",
    consulta: enlaceConsultaAuto,
    accion: enlaceVisitaAuto,
  },
  {
    tipo: "repuesto" as const,
    secundario: "Confirmar compatibilidad",
    consulta: enlaceConsultaRepuesto,
    accion: enlaceCompatibilidadRepuesto,
  },
])("acciones accesibles y seguras para $tipo", ({ tipo, secundario }) => {
  const propiedades = tipo === "auto" ? { tipo, datos: auto } : { tipo, datos: repuesto };
  render(<BotonesWhatsappFicha numero={numero} {...propiedades} />);
  const principal = screen.getByRole("link", { name: "Consultar por WhatsApp" });
  const adicional = screen.getByRole("link", { name: secundario });
  expect(principal).toHaveAttribute(
    "href",
    tipo === "auto" ? enlaceConsultaAuto(numero, auto) : enlaceConsultaRepuesto(numero, repuesto),
  );
  expect(adicional).toHaveAttribute(
    "href",
    tipo === "auto"
      ? enlaceVisitaAuto(numero, auto)
      : enlaceCompatibilidadRepuesto(numero, repuesto),
  );
  expect(principal).toHaveClass("bg-whatsapp-fuerte", "text-white");
  expect(adicional).toHaveClass("border-whatsapp-fuerte", "text-whatsapp-fuerte");
  for (const enlace of [principal, adicional]) {
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
    expect(enlace.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  }
});
it("la variante móvil mantiene solo Consultar con el mensaje contextual", () => {
  render(<BotonesWhatsappFicha numero={numero} tipo="auto" datos={auto} compacto />);
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Consultar" })).toHaveAttribute(
    "href",
    enlaceConsultaAuto(numero, auto),
  );
});
