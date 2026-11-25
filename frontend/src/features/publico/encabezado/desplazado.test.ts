import { describe, expect, it } from "vitest";

import { siguienteCompacto } from "./useDesplazado";

/**
 * Histéresis del encabezado compacto (#115). Al compactarse el encabezado pierde alto; si el
 * umbral de ida y el de vuelta fueran el mismo, el ajuste de desplazamiento del navegador lo haría
 * oscilar sin fin (y React cortaría con «Maximum update depth exceeded»).
 */
describe("encabezado compacto", () => {
  it("se compacta recién pasados 120 px y vuelve a crecer solo arriba de todo", () => {
    expect(siguienteCompacto(false, 60)).toBe(false);
    expect(siguienteCompacto(false, 119)).toBe(false);
    expect(siguienteCompacto(false, 121)).toBe(true);
    // Ya compacto: aunque el navegador lo suba unos 50 px por el cambio de alto, sigue compacto.
    expect(siguienteCompacto(true, 70)).toBe(true);
    expect(siguienteCompacto(true, 9)).toBe(true);
    expect(siguienteCompacto(true, 7)).toBe(false);
  });

  it("la diferencia entre los dos umbrales supera lo que cambia el alto del encabezado (≈ 55 px)", () => {
    let compacto = false;
    // Baja de a 5 px; si al compactarse el navegador sube 55 px, no vuelve a expandirse.
    for (let y = 0; y <= 200; y += 5) {
      const antes = compacto;
      compacto = siguienteCompacto(compacto, y);
      if (!antes && compacto) {
        expect(siguienteCompacto(compacto, y - 55)).toBe(true);
      }
    }
    expect(compacto).toBe(true);
  });
});
