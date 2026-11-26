import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { irA, router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import type { TextoMarketplace } from "./DialogoMarketplace";
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

const TEXTO: TextoMarketplace = {
  campos: [
    { etiqueta: "Título", valor: "Toyota Corolla 2015" },
    { etiqueta: "Precio", valor: "6500000" },
    { etiqueta: "Kilometraje", valor: "120 000 km" },
  ],
  descripcion: "Toyota Corolla 2015 · ₡6 500 000\n\n✔ 120 000 km · Automática",
  fotos: ["garaje-ruta/a", "garaje-ruta/b"],
};

function responder() {
  const pedido = vi.fn();
  servidor.use(
    http.get("*/api/v1/panel/articulos/:id/marketplace/", ({ params }) => {
      pedido(params.id);
      return HttpResponse.json(TEXTO);
    }),
  );
  return pedido;
}

describe("texto para Marketplace", () => {
  it("desde «Más acciones» muestra casillas, descripción y fotos, y copia", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD", "nube");
    const usuario = userEvent.setup();
    const pedido = responder();
    renderPanel(<PaginaArticulos />);
    const card = await screen.findByRole("article", { name: "Toyota Corolla 2015" });
    await usuario.click(within(card).getByRole("button", { name: "Más acciones" }));
    await usuario.click(within(card).getByRole("button", { name: "Texto para Marketplace" }));

    const dialogo = await screen.findByRole("dialog", { name: "Marketplace: Toyota Corolla 2015" });
    expect(await within(dialogo).findByText("120 000 km")).toBeInTheDocument();
    expect(pedido).toHaveBeenCalledWith(String(101));

    await usuario.click(within(dialogo).getByRole("button", { name: "Copiar descripción" }));
    expect(await navigator.clipboard.readText()).toBe(TEXTO.descripcion);
    await usuario.click(within(dialogo).getByRole("button", { name: "Copiar precio" }));
    expect(await navigator.clipboard.readText()).toBe("6500000");

    const fotos = within(dialogo).getAllByRole("link", { name: /Bajar foto/ });
    expect(fotos.map((a) => a.getAttribute("href"))).toEqual([
      "https://res.cloudinary.com/nube/image/upload/fl_attachment:foto-1,f_jpg,q_auto:good,w_1600,c_limit/garaje-ruta/a",
      "https://res.cloudinary.com/nube/image/upload/fl_attachment:foto-2,f_jpg,q_auto:good,w_1600,c_limit/garaje-ruta/b",
    ]);
    vi.unstubAllEnvs();
  });

  it("se abre solo con ?marketplace=id (aviso al crear) y al cerrar limpia la URL", async () => {
    const usuario = userEvent.setup();
    responder();
    irA("/panel/articulos", "?estado=disponible&marketplace=555", {});
    renderPanel(<PaginaArticulos />);
    const dialogo = await screen.findByRole("dialog", { name: "Texto para Marketplace" });
    expect(await within(dialogo).findByText("120 000 km")).toBeInTheDocument();
    await usuario.click(within(dialogo).getByRole("button", { name: "Listo" }));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/panel/articulos?estado=disponible"),
    );
  });

  it("si falla, ofrece reintentar", async () => {
    servidor.use(
      http.get("*/api/v1/panel/articulos/:id/marketplace/", () =>
        HttpResponse.json({ detail: "x" }, { status: 500 }),
      ),
    );
    irA("/panel/articulos", "?marketplace=555", {});
    renderPanel(<PaginaArticulos />);
    const dialogo = await screen.findByRole("dialog");
    expect(await within(dialogo).findByRole("alert", {}, { timeout: 5000 })).toHaveTextContent(
      "No pudimos armar el texto",
    );
    expect(within(dialogo).getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
