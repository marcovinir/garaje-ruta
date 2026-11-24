import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorFirma, ErrorFoto, type Firma, subirFoto } from "./subir";

const FIRMA: Firma = {
  cloud_name: "garaje",
  api_key: "123",
  timestamp: 1700000000,
  folder: "garaje-ruta/articulos",
  signature: "abc",
};

type XhrFalso = {
  abierto?: [string, string];
  enviado?: FormData;
  upload: {
    onprogress?: (e: { loaded: number; total: number; lengthComputable: boolean }) => void;
  };
  onload?: () => void;
  onerror?: () => void;
  status: number;
  responseText: string;
};

let ultimo: XhrFalso;

function instalarXhr() {
  vi.stubGlobal(
    "XMLHttpRequest",
    class {
      upload: XhrFalso["upload"] = {};
      status = 0;
      responseText = "";
      onload?: () => void;
      onerror?: () => void;
      abierto?: [string, string];
      enviado?: FormData;
      constructor() {
        ultimo = this as unknown as XhrFalso;
      }
      open(metodo: string, url: string) {
        this.abierto = [metodo, url];
      }
      send(datos: FormData) {
        this.enviado = datos;
      }
      abort() {}
    },
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("subirFoto", () => {
  it("sube a Cloudinary con la firma y reporta el progreso", async () => {
    instalarXhr();
    const progreso: number[] = [];
    const promesa = subirFoto(new Blob(["x"], { type: "image/webp" }), FIRMA, (p) =>
      progreso.push(p),
    );
    expect(ultimo.abierto).toEqual(["POST", "https://api.cloudinary.com/v1_1/garaje/image/upload"]);
    const datos = ultimo.enviado!;
    expect(datos.get("api_key")).toBe("123");
    expect(datos.get("timestamp")).toBe("1700000000");
    expect(datos.get("folder")).toBe("garaje-ruta/articulos");
    expect(datos.get("signature")).toBe("abc");
    expect(datos.get("file")).toBeInstanceOf(Blob);
    ultimo.upload.onprogress?.({ loaded: 50, total: 100, lengthComputable: true });
    ultimo.status = 200;
    ultimo.responseText = JSON.stringify({
      public_id: "garaje-ruta/articulos/x",
      width: 2000,
      height: 1500,
    });
    ultimo.onload?.();
    await expect(promesa).resolves.toEqual({
      public_id: "garaje-ruta/articulos/x",
      ancho: 2000,
      alto: 1500,
    });
    expect(progreso).toEqual([0.5]);
  });

  it("una firma vencida (401) es ErrorFirma para pedir otra", async () => {
    instalarXhr();
    const promesa = subirFoto(new Blob(["x"]), FIRMA, () => {});
    ultimo.status = 401;
    ultimo.responseText = JSON.stringify({ error: { message: "Stale request" } });
    ultimo.onload?.();
    await expect(promesa).rejects.toBeInstanceOf(ErrorFirma);
  });

  it("sin red falla con un mensaje que dice cómo seguir", async () => {
    instalarXhr();
    const promesa = subirFoto(new Blob(["x"]), FIRMA, () => {});
    ultimo.onerror?.();
    await expect(promesa).rejects.toThrow(ErrorFoto);
    await expect(promesa).rejects.toThrow("No se pudo subir. Revisá la conexión y reintentá.");
  });
});
