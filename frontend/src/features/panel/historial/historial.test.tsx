import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { yoDe } from "@/test/datos";
import { irA, router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { MarcoPanel } from "../estructura/MarcoPanel";

import { PaginaHistorial } from "./PaginaHistorial";

prepararServidor();

const acciones = [
  ["crear", "Creó", {}, "Creó el artículo"],
  ["editar", "Editó", { precio_colones: [9500000, 9100000] }, "Precio: ₡9 500 000 → ₡9 100 000"],
  [
    "cambiar_estado",
    "Cambió el estado",
    { antes: "disponible", despues: "reservado" },
    "Estado: Disponible → Reservado",
  ],
  ["vender", "Registró una venta", { cantidad: 2 }, "Vendió 2"],
  ["deshacer_venta", "Deshizo una venta", { cantidad: 1 }, "Deshizo la venta de 1"],
  ["fotos", "Cambió las fotos", { antes: 0, despues: 2 }, "Fotos: 0 → 2"],
  ["eliminar", "Eliminó", {}, "Eliminó el artículo"],
] as const;

function historial() {
  const pedidos: URLSearchParams[] = [];
  servidor.use(
    http.get("*/api/v1/panel/historial/", ({ request }) => {
      pedidos.push(new URL(request.url).searchParams);
      return HttpResponse.json({
        count: 42,
        next: null,
        previous: null,
        results: acciones.map(([accion, accion_texto, detalle], id) => ({
          id,
          accion,
          accion_texto,
          detalle,
          fecha: "2026-11-26T14:05:00-06:00",
          usuario: { id: 7, nombre: "Ana Ruiz" },
          articulo: {
            id: accion === "eliminar" ? null : 25,
            titulo: accion === "eliminar" ? "Repuesto dado de baja" : "Toyota Corolla",
          },
        })),
      });
    }),
    http.get("*/api/v1/panel/historial/usuarios/", () =>
      HttpResponse.json([{ id: 7, nombre: "Ana Ruiz" }]),
    ),
  );
  return pedidos;
}

it("el demo ve los resúmenes y un artículo eliminado queda sin enlace", async () => {
  historial();
  irA("/panel/historial");
  renderPanel(<PaginaHistorial />, { usuario: "demo" });
  for (const [, , , resumen] of acciones) expect(await screen.findByText(resumen)).toBeVisible();
  expect(screen.queryByRole("link", { name: "Repuesto dado de baja" })).not.toBeInTheDocument();
  expect(screen.getByText("Repuesto dado de baja")).toBeVisible();
});

it("mantiene los filtros en la URL y los envía a la API", async () => {
  const pedidos = historial();
  const usuario = userEvent.setup();
  irA(
    "/panel/historial",
    "accion=editar&usuario=7&desde=2026-11-01&hasta=2026-11-26&articulo=25&page=2",
  );
  renderPanel(<PaginaHistorial />);
  await screen.findByText("Vendió 2");
  expect(pedidos[0].get("desde")).toBe("2026-11-01");
  expect(pedidos[0].get("hasta")).toBe("2026-11-26");
  expect(pedidos[0].get("usuario")).toBe("7");
  expect(pedidos[0].get("accion")).toBe("editar");
  expect(pedidos[0].get("articulo")).toBe("25");
  await usuario.selectOptions(screen.getByLabelText("Acción"), "vender");
  await usuario.click(screen.getByRole("button", { name: "Aplicar filtros" }));
  const destino = new URL(router.replace.mock.calls.at(-1)?.[0] ?? "", "http://localhost");
  expect(destino.pathname).toBe("/panel/historial");
  expect(Object.fromEntries(destino.searchParams)).toEqual({
    accion: "vender",
    usuario: "7",
    articulo: "25",
    desde: "2026-11-01",
    hasta: "2026-11-26",
  });
});

it("el menú respeta el permiso de historial", () => {
  const { unmount } = renderPanel(
    <MarcoPanel yo={yoDe("demo")}>
      <p>Panel</p>
    </MarcoPanel>,
  );
  const menu = within(screen.getByRole("navigation", { name: "Panel" }));
  expect(menu.getByRole("link", { name: "Historial" })).toHaveAttribute("href", "/panel/historial");
  unmount();
  renderPanel(
    <MarcoPanel yo={{ ...yoDe("demo"), permisos: [] }}>
      <p>Panel</p>
    </MarcoPanel>,
  );
  expect(
    within(screen.getByRole("navigation", { name: "Panel" })).queryByRole("link", {
      name: "Historial",
    }),
  ).not.toBeInTheDocument();
});
