import { describe, expect, it } from "vitest";

import { conFiltro, filtrosPanelDesdeUrl } from "./filtros";

const desde = (q: string) => filtrosPanelDesdeUrl(new URLSearchParams(q));

describe("filtrosPanelDesdeUrl", () => {
  it("conserva los filtros válidos", () => {
    expect(
      desde(
        "q=corolla&tipo=repuesto&estado=vendido&agotado=1&desde=2026-11-01&hasta=2026-11-30&orden=actualizados&page=2",
      ),
    ).toEqual({
      q: "corolla",
      tipo: "repuesto",
      estado: "vendido",
      agotado: "1",
      desde: "2026-11-01",
      hasta: "2026-11-30",
      orden: "actualizados",
      page: "2",
    });
  });

  it("descarta fechas inválidas, estados raros y basura", () => {
    expect(
      desde("desde=abc&hasta=2026-02-31&estado=raro&tipo=moto&agotado=si&orden=x&page=0&foo=1"),
    ).toEqual({});
  });
});

describe("conFiltro", () => {
  it("cambia un filtro, quita los vacíos y vuelve a la primera página", () => {
    expect(conFiltro({ tipo: "auto", page: "3" }, "estado", "reservado")).toBe(
      "?estado=reservado&tipo=auto",
    );
    expect(conFiltro({ tipo: "auto", estado: "vendido" }, "estado", "")).toBe("?tipo=auto");
    expect(conFiltro({}, "tipo", "")).toBe("");
  });
});
