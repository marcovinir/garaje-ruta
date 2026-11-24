import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FILAS, TIPO_CAMBIO } from "@/test/datos";
import { irA, router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { PaginaArticulos } from "./PaginaArticulos";

prepararServidor();

function escritorio(si: boolean) {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: si && consulta.includes("1024"),
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe("listado de artículos", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("muestra los artículos con su estado en texto", async () => {
    renderPanel(<PaginaArticulos />);
    expect(await screen.findByRole("link", { name: "Toyota Corolla 2015" })).toBeInTheDocument();
    const sentra = screen.getByRole("article", { name: "Nissan Sentra 2010" });
    expect(within(sentra).getByText("Reservado")).toBeInTheDocument();
    expect(screen.getByText("5 artículos")).toBeInTheDocument();
  });

  it("un repuesto en 0 dice «Agotado» y uno con 2 «Quedan 2»", async () => {
    renderPanel(<PaginaArticulos />);
    const disco = await screen.findByRole("article", { name: "Disco de freno Sentra" });
    expect(within(disco).getByText("Agotado")).toBeInTheDocument();
    const pastillas = screen.getByRole("article", { name: "Pastillas de freno Corolla" });
    expect(within(pastillas).getByText("Quedan 2")).toBeInTheDocument();
  });

  it("los filtros van a la URL y a la consulta", async () => {
    const usuario = userEvent.setup();
    let consulta = "";
    servidor.use(
      http.get("*/api/v1/panel/articulos/", ({ request }) => {
        consulta = new URL(request.url).search;
        return HttpResponse.json({ count: 1, next: null, previous: null, results: [FILAS[4]] });
      }),
    );
    irA("/panel/articulos", "tipo=repuesto&agotado=1");
    renderPanel(<PaginaArticulos />);
    await screen.findByRole("article", { name: "Disco de freno Sentra" });
    expect(new URLSearchParams(consulta).get("tipo")).toBe("repuesto");
    expect(new URLSearchParams(consulta).get("agotado")).toBe("1");

    await usuario.selectOptions(screen.getByLabelText("Estado"), "reservado");
    expect(router.replace).toHaveBeenCalledWith(
      "/panel/articulos?agotado=1&estado=reservado&tipo=repuesto",
    );
  });

  it("la búsqueda se aplica al enviar", async () => {
    const usuario = userEvent.setup();
    renderPanel(<PaginaArticulos />);
    await usuario.type(
      screen.getByRole("searchbox", { name: "Buscar en el inventario" }),
      "corolla{Enter}",
    );
    expect(router.replace).toHaveBeenCalledWith("/panel/articulos?q=corolla");
  });

  it("avisa solo si el tipo de cambio está desactualizado", async () => {
    servidor.use(
      http.get("*/api/v1/tipo-cambio/", () =>
        HttpResponse.json({ ...TIPO_CAMBIO, desactualizado: true }),
      ),
    );
    renderPanel(<PaginaArticulos />);
    expect(await screen.findByText(/El tipo de cambio tiene más de 3 días/)).toBeInTheDocument();
  });

  it("sin aviso cuando el tipo de cambio está al día", async () => {
    renderPanel(<PaginaArticulos />);
    await screen.findByRole("link", { name: "Toyota Corolla 2015" });
    expect(screen.queryByText(/El tipo de cambio tiene más de 3 días/)).not.toBeInTheDocument();
  });

  it("el demo no ve los botones de crear", async () => {
    renderPanel(<PaginaArticulos />, { usuario: "demo" });
    await screen.findByRole("link", { name: "Toyota Corolla 2015" });
    expect(screen.queryByRole("link", { name: "Nuevo auto" })).not.toBeInTheDocument();
  });

  it("el colaborador sí puede crear", async () => {
    renderPanel(<PaginaArticulos />, { usuario: "colaborador" });
    expect(await screen.findByRole("link", { name: "Nuevo auto" })).toHaveAttribute(
      "href",
      "/panel/articulos/nuevo?tipo=auto",
    );
  });

  it("sin resultados ofrece limpiar los filtros", async () => {
    servidor.use(
      http.get("*/api/v1/panel/articulos/", () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
      ),
    );
    irA("/panel/articulos", "estado=oculto");
    renderPanel(<PaginaArticulos />);
    expect(await screen.findByText("No hay artículos con estos filtros.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quitar los filtros" })).toHaveAttribute(
      "href",
      "/panel/articulos",
    );
  });

  it("si la API falla ofrece reintentar", async () => {
    servidor.use(
      http.get("*/api/v1/panel/articulos/", () =>
        HttpResponse.json({ detalle: "x" }, { status: 500 }),
      ),
    );
    renderPanel(<PaginaArticulos />);
    expect(
      await screen.findByRole("button", { name: "Reintentar" }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("en escritorio es una tabla que se ordena por columna", async () => {
    const usuario = userEvent.setup();
    escritorio(true);
    renderPanel(<PaginaArticulos />);
    const tabla = await screen.findByRole("table");
    await usuario.click(within(tabla).getByRole("button", { name: "Precio" }));
    await waitFor(() => {
      const filas = within(tabla).getAllByRole("row").slice(1);
      expect(filas[0]).toHaveTextContent("Pastillas de freno Corolla");
    });
    expect(within(tabla).getByRole("columnheader", { name: /Precio/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("en la tabla las acciones van en una línea y «Compartir» pasa al menú", async () => {
    const usuario = userEvent.setup();
    escritorio(true);
    renderPanel(<PaginaArticulos />);
    const tabla = await screen.findByRole("table");
    const fila = within(tabla).getByRole("row", { name: /Toyota Corolla 2015/ });
    expect(within(fila).queryByRole("button", { name: "Compartir" })).not.toBeInTheDocument();
    await usuario.click(within(fila).getByRole("button", { name: "Más acciones" }));
    expect(within(fila).getByRole("button", { name: "Compartir" })).toBeInTheDocument();
  });
});
