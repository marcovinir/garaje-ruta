import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";

import { FILAS } from "@/test/datos";
import { router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { PaginaArticulos } from "./PaginaArticulos";

prepararServidor();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

const pastillas = FILAS[3];
const conCantidad = (n: number) => ({ ...pastillas, cantidad: n, agotado: n === 0 });

async function tarjeta(nombre: string) {
  return screen.findByRole("article", { name: nombre });
}

async function abrirMas(card: HTMLElement) {
  await userEvent.setup().click(within(card).getByRole("button", { name: "Más acciones" }));
}

describe("acciones rápidas", () => {
  it("«Vendí 1» descuenta y el aviso ofrece «Deshacer», que devuelve la cantidad", async () => {
    const usuario = userEvent.setup();
    servidor.use(
      http.post("*/api/v1/panel/articulos/201/vender/", () =>
        HttpResponse.json({ venta_id: 9, articulo: conCantidad(1) }, { status: 201 }),
      ),
      http.post("*/api/v1/panel/articulos/201/deshacer-venta/", () =>
        HttpResponse.json(conCantidad(2)),
      ),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Pastillas de freno Corolla");
    await usuario.click(within(card).getByRole("button", { name: "Vendí 1" }));
    expect(await within(card).findByText("Quedan 1")).toBeInTheDocument();
    expect(screen.getByText("Vendido: Pastillas de freno Corolla")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(await within(card).findByText("Quedan 2")).toBeInTheDocument();
  });

  it("si otra persona vendió el último (409), muestra el mensaje y la fila se actualiza (Review Focus 2)", async () => {
    const usuario = userEvent.setup();
    let vendido = false;
    servidor.use(
      http.post("*/api/v1/panel/articulos/201/vender/", () => {
        vendido = true;
        return HttpResponse.json({ detalle: "Solo quedan 0." }, { status: 409 });
      }),
      http.get("*/api/v1/panel/articulos/", () =>
        HttpResponse.json({
          count: FILAS.length,
          next: null,
          previous: null,
          results: FILAS.map((f) => (f.id === 201 && vendido ? conCantidad(0) : f)),
        }),
      ),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Pastillas de freno Corolla");
    await usuario.click(within(card).getByRole("button", { name: "Vendí 1" }));
    expect(await screen.findByText("Solo quedan 0.")).toBeInTheDocument();
    expect(await within(card).findByText("Agotado")).toBeInTheDocument();
  });

  it("un auto vendido no ofrece «Vendido» sino «Deshacer venta»", async () => {
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Toyota RAV4 2018");
    expect(within(card).queryByRole("button", { name: "Vendido" })).not.toBeInTheDocument();
    await abrirMas(card);
    expect(within(card).getByRole("button", { name: "Deshacer venta" })).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: "Reservar" })).not.toBeInTheDocument();
  });

  it("reservar cambia el estado con la respuesta de Django", async () => {
    const usuario = userEvent.setup();
    let cuerpo: unknown;
    servidor.use(
      http.post("*/api/v1/panel/articulos/101/estado/", async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json({ ...FILAS[0], estado: "reservado" });
      }),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Toyota Corolla 2015");
    await abrirMas(card);
    await usuario.click(within(card).getByRole("button", { name: "Reservar" }));
    expect(await within(card).findByText("Reservado")).toBeInTheDocument();
    expect(cuerpo).toEqual({ estado: "reservado" });
  });

  it("eliminar pide confirmación; cancelar no llama a la API", async () => {
    const usuario = userEvent.setup();
    let borrado = false;
    servidor.use(
      http.delete("*/api/v1/panel/articulos/101/", () => {
        borrado = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Toyota Corolla 2015");
    await abrirMas(card);
    await usuario.click(within(card).getByRole("button", { name: "Eliminar" }));
    const dialogo = screen.getByRole("dialog", { name: "¿Eliminar «Toyota Corolla 2015»?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(borrado).toBe(false);
  });

  it("eliminar con ventas (409) muestra el mensaje de Django", async () => {
    const usuario = userEvent.setup();
    servidor.use(
      http.delete("*/api/v1/panel/articulos/101/", () =>
        HttpResponse.json(
          { detalle: "Este artículo tiene ventas: ocúltalo en lugar de borrarlo." },
          { status: 409 },
        ),
      ),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Toyota Corolla 2015");
    await abrirMas(card);
    await usuario.click(within(card).getByRole("button", { name: "Eliminar" }));
    const dialogo = screen.getByRole("dialog", { name: "¿Eliminar «Toyota Corolla 2015»?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText(/tiene ventas: ocúltalo/)).toBeInTheDocument();
  });

  it("duplicar abre el formulario de la copia", async () => {
    const usuario = userEvent.setup();
    servidor.use(
      http.post("*/api/v1/panel/articulos/101/duplicar/", () =>
        HttpResponse.json({ id: 777 }, { status: 201 }),
      ),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Toyota Corolla 2015");
    await abrirMas(card);
    await usuario.click(within(card).getByRole("button", { name: "Duplicar" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/panel/articulos/777"));
  });

  it("el colaborador no puede eliminar y el demo no ve acciones", async () => {
    const { unmount } = renderPanel(<PaginaArticulos />, { usuario: "colaborador" });
    const card = await tarjeta("Toyota Corolla 2015");
    await abrirMas(card);
    expect(within(card).queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
    unmount();
    renderPanel(<PaginaArticulos />, { usuario: "demo" });
    const tarjetaDemo = await tarjeta("Toyota Corolla 2015");
    expect(
      within(tarjetaDemo).queryByRole("button", { name: "Más acciones" }),
    ).not.toBeInTheDocument();
    expect(within(tarjetaDemo).queryByRole("button", { name: "Vendido" })).not.toBeInTheDocument();
  });
});
