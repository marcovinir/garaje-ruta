import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { irA, router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { PaginaReportes } from "./PaginaReportes";

prepararServidor();

export const REPORTE = {
  desde: "2026-10-01",
  hasta: "2026-11-26",
  ventas: { cantidad: 3, monto: 6090000, dias_promedio: 10.5 },
  ventas_por_mes: [
    { mes: "2026-10", auto: { cantidad: 1, monto: 6000000 }, repuesto: { cantidad: 0, monto: 0 } },
    { mes: "2026-11", auto: { cantidad: 0, monto: 0 }, repuesto: { cantidad: 2, monto: 90000 } },
  ],
  interes: { consultas: 4, visitas: 1, compatibilidad: 1 },
  mas_vistos: [
    {
      id: 7,
      titulo: "Toyota Corolla",
      tipo: "auto",
      estado: "disponible",
      ruta: "/autos/toyota-7",
      total: 10,
    },
  ],
  mas_consultados: [
    {
      id: 8,
      titulo: "Alternador",
      tipo: "repuesto",
      estado: "agotado",
      ruta: "/repuestos/alternador-8",
      total: 2,
    },
  ],
};

it("muestra ventas y consultas por separado, con tablas y enlaces para el demo", async () => {
  servidor.use(http.get("*/api/v1/panel/reportes/", () => HttpResponse.json(REPORTE)));
  irA("/panel/reportes");
  renderPanel(<PaginaReportes />, { usuario: "demo" });
  const mensual = await screen.findByRole("table", { name: "Ventas por mes" });
  expect(within(mensual).getByText("₡90 000")).toBeVisible();
  expect(screen.getByText("Consultas por WhatsApp")).toBeVisible();
  const consultas = screen.getByRole("table", { name: "Más consultados por WhatsApp" });
  expect(within(consultas).getByRole("columnheader", { name: "Consultas" })).toBeVisible();
  expect(within(consultas).getByRole("link", { name: "Alternador" })).toHaveAttribute(
    "href",
    "/repuestos/alternador-8",
  );
  expect(screen.getByText("₡6 090 000")).toBeVisible();
});

it("lee el rango de la URL y vuelve a navegar al seleccionarlo", async () => {
  let busqueda: URLSearchParams | undefined;
  servidor.use(
    http.get("*/api/v1/panel/reportes/", ({ request }) => {
      busqueda = new URL(request.url).searchParams;
      return HttpResponse.json(REPORTE);
    }),
  );
  irA("/panel/reportes", "rango=30-dias");
  renderPanel(<PaginaReportes />);
  await screen.findByRole("table", { name: "Ventas por mes" });
  expect(busqueda?.get("hasta")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(Date.parse(busqueda!.get("hasta")!) - Date.parse(busqueda!.get("desde")!)).toBe(
    29 * 86400000,
  );
  await userEvent.setup().selectOptions(screen.getByLabelText("Rango"), "12-meses");
  expect(router.replace).toHaveBeenCalledWith("/panel/reportes?rango=12-meses");
});
