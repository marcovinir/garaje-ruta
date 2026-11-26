import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { irA } from "@/test/navegacion";

import { Encabezado } from "./Encabezado";

afterEach(() => irA("/panel/articulos"));

const principal = () => screen.getByRole("navigation", { name: "Principal" });

describe("encabezado público (#115)", () => {
  it("tiene el logo que lleva al inicio y el buscador", () => {
    irA("/");
    render(<Encabezado />);
    expect(screen.getAllByRole("link", { name: "Garaje Ruta, inicio" })[0]).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getAllByRole("search").length).toBeGreaterThan(0);
  });

  it("la navegación tiene Inicio, Autos, Repuestos, Ofertas y Contacto, y marca la página actual", () => {
    irA("/autos");
    render(<Encabezado />);
    const nav = principal();
    for (const nombre of ["Inicio", "Autos", "Repuestos", "Ofertas", "Contacto"]) {
      expect(within(nav).getByRole("link", { name: nombre })).toBeInTheDocument();
    }
    expect(within(nav).getByRole("link", { name: "Autos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Ofertas" })).not.toHaveAttribute("aria-current");
  });

  it("con ?ofertas=1 la página actual es Ofertas, que va destacada con su ícono", () => {
    irA("/autos", "ofertas=1");
    render(<Encabezado />);
    const ofertas = within(principal()).getByRole("link", { name: "Ofertas" });
    expect(ofertas).toHaveAttribute("aria-current", "page");
    expect(ofertas).toHaveClass("text-rojo-oscuro");
    expect(ofertas.querySelector("svg")).not.toBeNull();
    expect(within(principal()).getByRole("link", { name: "Autos" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("Contacto lleva a la página /contacto y la marca como actual", () => {
    irA("/contacto");
    render(<Encabezado />);
    const contacto = within(principal()).getByRole("link", { name: "Contacto" });
    expect(contacto).toHaveAttribute("href", "/contacto");
    expect(contacto).toHaveAttribute("aria-current", "page");
  });

  it("el celular tiene accesos a Autos, Repuestos y Ofertas", () => {
    irA("/");
    render(<Encabezado />);
    const accesos = screen.getByRole("navigation", { name: "Accesos rápidos" });
    for (const nombre of ["Autos", "Repuestos", "Ofertas"]) {
      expect(within(accesos).getByRole("link", { name: nombre })).toBeInTheDocument();
    }
  });

  it("el menú se cierra al tocar cualquier enlace del encabezado (accesos, logo)", async () => {
    const usuario = userEvent.setup();
    irA("/");
    render(<Encabezado />);
    const abrir = () => usuario.click(screen.getByRole("button", { name: "Abrir el menú" }));
    await abrir();
    const accesos = screen.getByRole("navigation", { name: "Accesos rápidos" });
    fireEvent.click(within(accesos).getByRole("link", { name: "Repuestos" }));
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();
    await abrir();
    fireEvent.click(screen.getAllByRole("link", { name: "Garaje Ruta, inicio" })[1]);
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();
  });

  it("el menú se cierra con Atrás del navegador", async () => {
    irA("/");
    render(<Encabezado />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Abrir el menú" }));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();
  });

  it("al cerrar el menú con Esc el foco vuelve al botón del menú", async () => {
    const usuario = userEvent.setup();
    irA("/");
    render(<Encabezado />);
    const boton = screen.getByRole("button", { name: "Abrir el menú" });
    await usuario.click(boton);
    within(screen.getByRole("navigation", { name: "Menú" }))
      .getByRole("link", { name: "Inicio" })
      .focus();
    await usuario.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Abrir el menú" })).toHaveFocus();
  });

  it("el menú del celular trae Inicio y Contacto, y se cierra con Esc y al elegir una página", async () => {
    const usuario = userEvent.setup();
    irA("/");
    render(<Encabezado />);
    const boton = screen.getByRole("button", { name: "Abrir el menú" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    await usuario.click(boton);
    const menu = screen.getByRole("navigation", { name: "Menú" });
    expect(within(menu).getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Contacto" })).toBeInTheDocument();
    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Abrir el menú" }));
    const menu2 = screen.getByRole("navigation", { name: "Menú" });
    await usuario.click(within(menu2).getByRole("link", { name: "Repuestos" }));
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();
  });
});
