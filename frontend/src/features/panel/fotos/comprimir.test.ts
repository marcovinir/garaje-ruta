import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorFoto, comprimir } from "./comprimir";

let dibujado: { ancho: number; alto: number } | null = null;

beforeEach(() => {
  dibujado = null;
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async (archivo: Blob) => {
      if (archivo.type === "image/heic") throw new DOMException("no", "InvalidStateError");
      return { width: 4000, height: 3000, close: vi.fn() };
    }),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    return {
      drawImage: (_b: unknown, _x: number, _y: number, ancho: number, alto: number) => {
        dibujado = { ancho, alto };
      },
    } as unknown as CanvasRenderingContext2D;
  });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    listo: BlobCallback,
    tipo?: string,
  ) {
    listo(new Blob(["x"], { type: tipo ?? "image/png" }));
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const archivo = (tipo: string) => new File(["datos"], "foto", { type: tipo });

describe("comprimir", () => {
  it("limita el lado mayor a 2000 px conservando la proporción y usa WebP", async () => {
    const r = await comprimir(archivo("image/jpeg"));
    expect([r.ancho, r.alto]).toEqual([2000, 1500]);
    expect(dibujado).toEqual({ ancho: 2000, alto: 1500 });
    expect(r.blob.type).toBe("image/webp");
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), {
      imageOrientation: "from-image",
    });
  });

  it("si el navegador no codifica WebP usa JPEG", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
      this: HTMLCanvasElement,
      listo: BlobCallback,
      tipo?: string,
    ) {
      listo(new Blob(["x"], { type: tipo === "image/webp" ? "image/png" : (tipo ?? "") }));
    });
    expect((await comprimir(archivo("image/jpeg"))).blob.type).toBe("image/jpeg");
  });

  it("una foto chica no se agranda", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 800, height: 600, close() {} })),
    );
    const r = await comprimir(archivo("image/png"));
    expect([r.ancho, r.alto]).toEqual([800, 600]);
  });

  it("rechaza lo que no es imagen y lo que el navegador no puede leer (HEIC)", async () => {
    await expect(comprimir(archivo("text/plain"))).rejects.toBeInstanceOf(ErrorFoto);
    await expect(comprimir(archivo("image/heic"))).rejects.toThrow(
      "No pudimos leer esa foto. Probá con JPG o PNG.",
    );
  });
});
