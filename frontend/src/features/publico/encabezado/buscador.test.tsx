import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { router } from "@/test/navegacion";
import { prepararServidor, servidor } from "@/test/servidor";

import { Buscador } from "./Buscador";

prepararServidor();

type Pedido = { q: string; tipo: string; tamano: string };

function tarjeta(id: number, tipo: "auto" | "repuesto", titulo: string) {
  return {
    id,
    tipo,
    titulo,
    ruta: `/${tipo === "auto" ? "autos" : "repuestos"}/${titulo.toLowerCase().replace(/ /g, "-")}-${id}`,
    precio_colones: 5_000_000 + id,
    precio_anterior_colones: null,
    precio_usd: null,
    foto: null,
    auto: null,
    repuesto: null,
  };
}

/** API pública falsa: 6 autos y 2 repuestos para «toyota», nada para «zzz». */
function api(pedidos: Pedido[], { falla = false } = {}) {
  servidor.use(
    http.get("*/api/v1/articulos/", async ({ request }) => {
      const p = new URL(request.url).searchParams;
      const pedido = {
        q: p.get("q") ?? "",
        tipo: p.get("tipo") ?? "",
        tamano: p.get("tamano") ?? "",
      };
      pedidos.push(pedido);
      if (falla) return HttpResponse.json({ detalle: "x" }, { status: 500 });
      if (pedido.q === "lento") await delay(800);
      const autos = Array.from({ length: 6 }, (_, i) =>
        tarjeta(i + 1, "auto", `Toyota ${pedido.q} ${i + 1}`),
      );
      const repuestos = [
        tarjeta(50, "repuesto", `Alternador ${pedido.q}`),
        tarjeta(51, "repuesto", `Batería ${pedido.q}`),
      ];
      const lista = pedido.q === "zzz" ? [] : pedido.tipo === "auto" ? autos : repuestos;
      const tamano = Number(pedido.tamano) || 20;
      return HttpResponse.json({
        count: lista.length,
        next: null,
        previous: null,
        results: lista.slice(0, tamano),
      });
    }),
  );
}

const campo = () => screen.getByRole("combobox", { name: "Buscar marca, modelo o pieza" });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  router.push.mockReset();
});
afterEach(() => vi.useRealTimers());

const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe("buscador con sugerencias (#115)", () => {
  it("no busca con una letra ni antes de 300 ms; después pide autos y repuestos, 4 de cada uno", async () => {
    const pedidos: Pedido[] = [];
    api(pedidos);
    render(<Buscador id="b" />);
    const u = usuario();
    await u.type(campo(), "t");
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(pedidos).toHaveLength(0);
    await u.type(campo(), "oyota");
    await act(() => vi.advanceTimersByTimeAsync(250));
    expect(pedidos).toHaveLength(0);
    await act(() => vi.advanceTimersByTimeAsync(100));
    await waitFor(() => expect(pedidos).toHaveLength(2));
    expect(pedidos.map((p) => p.tipo).sort()).toEqual(["auto", "repuesto"]);
    expect(pedidos.every((p) => p.q === "toyota" && p.tamano === "4")).toBe(true);

    const lista = await screen.findByRole("listbox");
    const autos = within(lista).getByRole("group", { name: "Autos" });
    const repuestos = within(lista).getByRole("group", { name: "Repuestos" });
    expect(within(autos).getAllByRole("option")).toHaveLength(4);
    expect(within(repuestos).getAllByRole("option")).toHaveLength(2);
    expect(
      within(lista).getByRole("option", { name: /Ver todos los resultados/ }),
    ).toBeInTheDocument();
    expect(campo()).toHaveAttribute("aria-expanded", "true");
  });

  it("dice cuando no hay resultados y cuando falla", async () => {
    const pedidos: Pedido[] = [];
    api(pedidos);
    render(<Buscador id="b" />);
    const u = usuario();
    await u.type(campo(), "zzz");
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(await screen.findByText("Sin resultados para «zzz».")).toBeInTheDocument();

    api([], { falla: true });
    await u.clear(campo());
    await u.type(campo(), "toyota");
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(await screen.findByText("No pudimos buscar. Probá de nuevo.")).toBeInTheDocument();
  });

  it("con el teclado: flechas y Enter van al artículo; Esc cierra", async () => {
    api([]);
    render(<Buscador id="b" />);
    const u = usuario();
    await u.type(campo(), "toyota");
    await act(() => vi.advanceTimersByTimeAsync(350));
    await screen.findByRole("listbox");
    await u.keyboard("{ArrowDown}{ArrowDown}");
    const segunda = screen.getAllByRole("option")[1];
    expect(campo()).toHaveAttribute("aria-activedescendant", segunda.id);
    expect(segunda).toHaveAttribute("aria-selected", "true");
    await u.keyboard("{Enter}");
    expect(router.push).toHaveBeenCalledWith("/autos/toyota-toyota-2-2");

    await u.type(campo(), "s");
    await act(() => vi.advanceTimersByTimeAsync(350));
    await screen.findByRole("listbox");
    await u.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(campo()).toHaveAttribute("aria-expanded", "false");
  });

  it("Enter sin elegir y «Ver todos los resultados» van a /buscar", async () => {
    api([]);
    render(<Buscador id="b" />);
    const u = usuario();
    await u.type(campo(), "corola alt");
    await u.keyboard("{Enter}");
    expect(router.push).toHaveBeenCalledWith("/buscar?q=corola%20alt");

    router.push.mockReset();
    await u.type(campo(), "x");
    await act(() => vi.advanceTimersByTimeAsync(350));
    fireEvent.click(await screen.findByRole("option", { name: /Ver todos los resultados/ }));
    expect(router.push).toHaveBeenCalledWith("/buscar?q=corola%20altx");
  });

  it("Esc antes de los 300 ms cancela la búsqueda: la lista no se abre sola después", async () => {
    const pedidos: Pedido[] = [];
    api(pedidos);
    render(<Buscador id="b" />);
    const u = usuario();
    await u.type(campo(), "toyota");
    await u.keyboard("{Escape}");
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(pedidos).toHaveLength(0);
    expect(campo()).toHaveAttribute("aria-expanded", "false");
  });

  it("al salir del campo antes de que lleguen las sugerencias, no se abren", async () => {
    api([]);
    render(
      <>
        <Buscador id="b" />
        <button type="button">Otra cosa</button>
      </>,
    );
    const u = usuario();
    await u.type(campo(), "toyota");
    await u.click(screen.getByRole("button", { name: "Otra cosa" }));
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("las opciones no se recrean al moverse con las flechas (lectores de pantalla)", async () => {
    api([]);
    render(<Buscador id="b" />);
    const u = usuario();
    await u.type(campo(), "toyota");
    await act(() => vi.advanceTimersByTimeAsync(350));
    await screen.findByRole("listbox");
    const primera = screen.getAllByRole("option")[0];
    await u.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")[0]).toBe(primera);
  });

  it("Esc con la lista abierta no sigue hacia afuera (no cierra el menú del celular)", async () => {
    api([]);
    const afuera = vi.fn();
    render(
      <div onKeyDown={(e) => afuera(e.defaultPrevented)}>
        <Buscador id="b" />
      </div>,
    );
    const u = usuario();
    await u.type(campo(), "toyota");
    await act(() => vi.advanceTimersByTimeAsync(350));
    await screen.findByRole("listbox");
    afuera.mockClear();
    await u.keyboard("{Escape}");
    expect(afuera).not.toHaveBeenCalledWith(false);
  });

  it("una respuesta vieja que llega tarde no pisa la nueva", async () => {
    api([]);
    render(<Buscador id="b" />);
    const u = usuario();
    await u.type(campo(), "lento");
    await act(() => vi.advanceTimersByTimeAsync(350));
    await u.clear(campo());
    await u.type(campo(), "nissan");
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(await screen.findByRole("option", { name: /Toyota nissan 1/ })).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.queryByRole("option", { name: /lento/ })).not.toBeInTheDocument();
  });
});
