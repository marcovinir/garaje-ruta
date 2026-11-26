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

/** Responde el diálogo de confirmación con el botón que lleva el nombre de la acción. */
async function confirmar(boton: string) {
  const dialogo = await screen.findByRole("dialog");
  await userEvent.setup().click(within(dialogo).getByRole("button", { name: boton }));
}

async function abrirMas(card: HTMLElement) {
  await userEvent.setup().click(within(card).getByRole("button", { name: "Más acciones" }));
}

describe("acciones rápidas", () => {
  it("«Vendí 1» descuenta y el aviso ofrece «Deshacer», que devuelve la cantidad", async () => {
    const usuario = userEvent.setup();
    let cuerpoDeshacer: unknown;
    servidor.use(
      http.post("*/api/v1/panel/articulos/201/vender/", () =>
        HttpResponse.json({ venta_id: 9, articulo: conCantidad(1) }, { status: 201 }),
      ),
      http.post("*/api/v1/panel/articulos/201/deshacer-venta/", async ({ request }) => {
        cuerpoDeshacer = await request.json();
        return HttpResponse.json(conCantidad(2));
      }),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Pastillas de freno Corolla");
    await usuario.click(within(card).getByRole("button", { name: "Vendí 1" }));
    await confirmar("Sí, registrar venta");
    expect(await within(card).findByText("Quedan 1")).toBeInTheDocument();
    expect(screen.getByText("Vendido: Pastillas de freno Corolla")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(await within(card).findByText("Quedan 2")).toBeInTheDocument();
    // Deshace esa venta y no la última del artículo, que podría ser de otra persona.
    expect(cuerpoDeshacer).toEqual({ venta_id: 9 });
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
    await confirmar("Sí, registrar venta");
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
    await confirmar("Sí, reservar");
    expect(await within(card).findByText("Reservado")).toBeInTheDocument();
    expect(cuerpo).toEqual({ estado: "reservado" });
  });

  it("«Vendido», cambiar el estado y deshacer una venta preguntan antes; «No» no llama a la API", async () => {
    const usuario = userEvent.setup();
    let llamadas = 0;
    servidor.use(
      http.post("*/api/v1/panel/articulos/:id/:accion/", () => {
        llamadas += 1;
        return HttpResponse.json({});
      }),
    );
    renderPanel(<PaginaArticulos />);
    const corolla = await tarjeta("Toyota Corolla 2015");
    await usuario.click(within(corolla).getByRole("button", { name: "Vendido" }));
    let dialogo = await screen.findByRole("dialog", { name: "¿Marcar como vendido?" });
    expect(dialogo).toHaveTextContent("Toyota Corolla 2015");
    await usuario.click(within(dialogo).getByRole("button", { name: "No" }));
    await abrirMas(corolla);
    await usuario.click(within(corolla).getByRole("button", { name: "Ocultar" }));
    dialogo = await screen.findByRole("dialog", { name: "¿Ocultar?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "No" }));
    const rav4 = await tarjeta("Toyota RAV4 2018");
    await abrirMas(rav4);
    await usuario.click(within(rav4).getByRole("button", { name: "Deshacer venta" }));
    dialogo = await screen.findByRole("dialog", { name: "¿Deshacer la venta?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "No" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(llamadas).toBe(0);
  });

  it("confirmar «Deshacer venta» la deshace", async () => {
    const usuario = userEvent.setup();
    let deshecha = false;
    servidor.use(
      http.post("*/api/v1/panel/articulos/103/deshacer-venta/", () => {
        deshecha = true;
        return HttpResponse.json({ ...FILAS[2], estado: "disponible" });
      }),
    );
    renderPanel(<PaginaArticulos />);
    const rav4 = await tarjeta("Toyota RAV4 2018");
    await abrirMas(rav4);
    await usuario.click(within(rav4).getByRole("button", { name: "Deshacer venta" }));
    await confirmar("Sí, deshacer venta");
    await waitFor(() => expect(deshecha).toBe(true));
  });

  it("«Vendí varios…» valida la cantidad (1 al stock) y la reinicia a 1 al abrir", async () => {
    const usuario = userEvent.setup();
    let cuerpo: unknown;
    servidor.use(
      http.post("*/api/v1/panel/articulos/201/vender/", async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json({ venta_id: 5, articulo: conCantidad(0) }, { status: 201 });
      }),
    );
    renderPanel(<PaginaArticulos />);
    const card = await tarjeta("Pastillas de freno Corolla");
    await abrirMas(card);
    await usuario.click(within(card).getByRole("button", { name: "Vendí varios…" }));
    let dialogo = await screen.findByRole("dialog");
    const campo = within(dialogo).getByLabelText("Cantidad");
    await usuario.clear(campo);
    await usuario.type(campo, "5");
    await usuario.click(within(dialogo).getByRole("button", { name: "Registrar venta" }));
    expect(within(dialogo).getByText("Entre 1 y 2.")).toBeInTheDocument();
    expect(cuerpo).toBeUndefined();
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    await abrirMas(card);
    await usuario.click(within(card).getByRole("button", { name: "Vendí varios…" }));
    dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByLabelText("Cantidad")).toHaveValue(1);
    expect(within(dialogo).queryByText("Entre 1 y 2.")).not.toBeInTheDocument();
    await usuario.clear(within(dialogo).getByLabelText("Cantidad"));
    await usuario.type(within(dialogo).getByLabelText("Cantidad"), "2");
    await usuario.click(within(dialogo).getByRole("button", { name: "Registrar venta" }));
    await waitFor(() => expect(cuerpo).toEqual({ cantidad: 2 }));
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
          { detalle: "Este artículo tiene ventas: ocultalo en lugar de borrarlo." },
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
    expect(await screen.findByText(/tiene ventas: ocultalo/)).toBeInTheDocument();
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

  it("el colaborador no puede eliminar y el demo solo puede sacar el texto para Marketplace", async () => {
    const { unmount } = renderPanel(<PaginaArticulos />, { usuario: "colaborador" });
    const card = await tarjeta("Toyota Corolla 2015");
    await abrirMas(card);
    expect(within(card).queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
    unmount();
    renderPanel(<PaginaArticulos />, { usuario: "demo" });
    const tarjetaDemo = await tarjeta("Toyota Corolla 2015");
    await abrirMas(tarjetaDemo);
    expect(
      within(tarjetaDemo)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Texto para Marketplace"]);
    expect(within(tarjetaDemo).queryByRole("button", { name: "Vendido" })).not.toBeInTheDocument();
  });
});
