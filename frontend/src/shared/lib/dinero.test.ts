import { describe, expect, it } from "vitest";

import { colones, dolares } from "./dinero";

describe("dinero", () => {
  it("formatea colones con espacio fino entre miles", () => {
    expect(colones(6500000)).toBe("₡6 500 000");
    expect(colones(45000)).toBe("₡45 000");
    expect(colones(900)).toBe("₡900");
  });

  it("formatea dólares aproximados o nada si no hay tipo de cambio", () => {
    expect(dolares(14500)).toBe("≈ US$14 500");
    expect(dolares(null)).toBeNull();
  });
});
