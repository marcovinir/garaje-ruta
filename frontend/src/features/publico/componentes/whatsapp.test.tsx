import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { irA } from "@/test/navegacion";

import { BotonWhatsapp } from "./BotonWhatsapp";
import { WhatsappFlotante } from "./WhatsappFlotante";

const texto = (enlace: HTMLElement) =>
  decodeURIComponent(new URL(enlace.getAttribute("href")!).searchParams.get("text") ?? "");

afterEach(() => irA("/panel/articulos"));

describe("WhatsApp en verde (#115)", () => {
  it("«Consultar por WhatsApp» es verde con texto blanco", () => {
    render(<BotonWhatsapp numero="50688887777" titulo="Toyota" url="https://x.test/autos/a-1" />);
    const enlace = screen.getByRole("link", { name: /Consultar por WhatsApp/ });
    expect(enlace).toHaveClass("bg-whatsapp-fuerte", "text-white");
  });

  it("el botón flotante abre WhatsApp con el mensaje general y tiene nombre", () => {
    irA("/autos");
    render(<WhatsappFlotante numero="50686877280" />);
    const enlace = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    expect(enlace.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/50686877280\?text=/);
    expect(texto(enlace)).toBe("Hola, vengo de la web de Garaje Ruta.");
    expect(enlace).toHaveClass("bg-whatsapp");
    expect(enlace).toHaveAttribute("target", "_blank");
  });

  it("en una ficha lleva el título y el enlace del artículo, y se oculta en el celular", () => {
    irA("/autos/toyota-corolla-2018-12");
    render(
      <>
        <h1 data-titulo-ficha>Toyota Corolla 2018</h1>
        <WhatsappFlotante numero="50686877280" />
      </>,
    );
    const enlace = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    // El enlace se completa al usarlo (clic, foco o mouse encima), con la ficha ya pintada.
    enlace.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(enlace);
    expect(texto(enlace)).toContain("Toyota Corolla 2018");
    expect(texto(enlace)).toContain("/autos/toyota-corolla-2018-12");
    expect(enlace).toHaveClass("max-lg:hidden");
  });

  it("al pasar de una ficha a un listado vuelve al mensaje general", () => {
    irA("/autos/toyota-corolla-2018-12");
    const { rerender } = render(
      <>
        <h1 data-titulo-ficha>Toyota Corolla 2018</h1>
        <WhatsappFlotante numero="50686877280" />
      </>,
    );
    const enlace = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    enlace.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(enlace);
    irA("/autos");
    rerender(
      <>
        <h1>Autos usados</h1>
        <WhatsappFlotante numero="50686877280" />
      </>,
    );
    fireEvent.click(enlace);
    expect(texto(enlace)).toBe("Hola, vengo de la web de Garaje Ruta.");
  });

  it("usa el mensaje general en un 404 bajo una ruta de ficha", () => {
    irA("/autos/auto-inexistente-99999999");
    render(
      <>
        <h1>Esta página no existe</h1>
        <WhatsappFlotante numero="50686877280" />
      </>,
    );
    const enlace = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    fireEvent.focus(enlace);
    expect(texto(enlace)).toBe("Hola, vengo de la web de Garaje Ruta.");
  });

  it("en un listado no se oculta en el celular", () => {
    irA("/repuestos");
    render(<WhatsappFlotante numero="50686877280" />);
    expect(screen.getByRole("link", { name: "Escribinos por WhatsApp" })).not.toHaveClass(
      "max-lg:hidden",
    );
  });
});
