import { afterEach, describe, expect, it, vi } from "vitest";

import { compartirEnlace } from "./compartir";

describe("compartirEnlace", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("usa el menú del teléfono si existe", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    await expect(compartirEnlace("Kia Rio", "https://x.test/autos/kia-rio-3")).resolves.toBe(
      "compartido",
    );
    expect(share).toHaveBeenCalledWith({ title: "Kia Rio", url: "https://x.test/autos/kia-rio-3" });
  });

  it("si la persona cierra el menú no es un error", async () => {
    const cancelar = Object.assign(new Error("cancelado"), { name: "AbortError" });
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(cancelar) });
    await expect(compartirEnlace("Kia Rio", "https://x.test")).resolves.toBe("cancelado");
  });

  it("sin menú copia el enlace", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(compartirEnlace("Kia Rio", "https://x.test")).resolves.toBe("copiado");
    expect(writeText).toHaveBeenCalledWith("https://x.test");
  });

  it("si no puede copiar devuelve error", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) },
    });
    await expect(compartirEnlace("Kia Rio", "https://x.test")).resolves.toBe("error");
  });
});
