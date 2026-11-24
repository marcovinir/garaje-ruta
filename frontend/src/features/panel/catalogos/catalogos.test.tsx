import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";

import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { PaginaCatalogos } from "./PaginaCatalogos";

prepararServidor();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

const MARCAS = [
  { id: 13, nombre: "Toyota", slug: "toyota" },
  { id: 15, nombre: "Nissan", slug: "nissan" },
];

const fila = (nombre: string) => screen.findByRole("listitem", { name: nombre });

describe("catálogos", () => {
  it("renombrar una marca manda PATCH con el nombre nuevo", async () => {
    const u = userEvent.setup();
    let cuerpo: unknown;
    servidor.use(
      http.get("*/api/v1/panel/marcas/", () => HttpResponse.json(MARCAS)),
      http.patch("*/api/v1/panel/marcas/15/", async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json({ ...MARCAS[1], ...(cuerpo as object) });
      }),
    );
    renderPanel(<PaginaCatalogos />);
    await u.click(within(await fila("Nissan")).getByRole("button", { name: "Renombrar" }));
    const campo = within(await fila("Nissan")).getByLabelText("Nombre nuevo de Nissan");
    await u.clear(campo);
    await u.type(campo, "Nissan Motors{Enter}");
    await waitFor(() => expect(cuerpo).toEqual({ nombre: "Nissan Motors" }));
  });

  it("borrar uno en uso muestra el mensaje de Django", async () => {
    const u = userEvent.setup();
    servidor.use(
      http.get("*/api/v1/panel/marcas/", () => HttpResponse.json(MARCAS)),
      http.delete("*/api/v1/panel/marcas/13/", () =>
        HttpResponse.json({ detalle: "Está en uso: no se puede borrar." }, { status: 409 }),
      ),
    );
    renderPanel(<PaginaCatalogos />);
    await u.click(within(await fila("Toyota")).getByRole("button", { name: "Eliminar" }));
    const dialogo = screen.getByRole("dialog", { name: "¿Eliminar «Toyota»?" });
    await u.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    expect(await screen.findByText("Está en uso: no se puede borrar.")).toBeInTheDocument();
  });

  it("agrega una transmisión en su pestaña", async () => {
    const u = userEvent.setup();
    let cuerpo: unknown;
    servidor.use(
      http.get("*/api/v1/panel/marcas/", () => HttpResponse.json(MARCAS)),
      http.get("*/api/v1/panel/transmisiones/", () =>
        HttpResponse.json([{ id: 1, nombre: "Manual" }]),
      ),
      http.post("*/api/v1/panel/transmisiones/", async ({ request }) => {
        cuerpo = await request.json();
        return HttpResponse.json({ id: 3, nombre: "CVT" }, { status: 201 });
      }),
    );
    renderPanel(<PaginaCatalogos />);
    await u.click(await screen.findByRole("tab", { name: "Transmisiones" }));
    await u.type(await screen.findByLabelText("Nueva transmisión"), "CVT");
    await u.click(screen.getByRole("button", { name: "Agregar" }));
    await waitFor(() => expect(cuerpo).toEqual({ nombre: "CVT" }));
  });

  it("el colaborador no tiene acceso", async () => {
    renderPanel(<PaginaCatalogos />, { usuario: "colaborador" });
    expect(await screen.findByText("No tenés acceso a esta sección")).toBeInTheDocument();
  });
});
