import { ApiError, api } from "@/shared/api/navegador";
import type { FotoApi } from "@/shared/api/tipos";

import { ErrorFoto } from "./comprimir";

export { ErrorFoto };

/** Lo que devuelve `POST /panel/fotos/firma/` (backend/apps/articulos/fotos.py). */
export type Firma = {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/** La firma venció (Cloudinary responde 401): hay que pedir otra y reintentar. */
export class ErrorFirma extends ErrorFoto {
  constructor() {
    super("La firma de subida venció.");
    this.name = "ErrorFirma";
  }
}

export const SIN_CONFIGURAR = "Las fotos todavía no están configuradas.";

export async function pedirFirma(): Promise<Firma> {
  let firma: Firma;
  try {
    firma = await api<Firma>("/panel/fotos/firma/", { metodo: "POST" });
  } catch (error) {
    if (error instanceof ApiError && error.status >= 500) throw new ErrorFoto(SIN_CONFIGURAR);
    throw error;
  }
  if (!firma.cloud_name || !firma.api_key) throw new ErrorFoto(SIN_CONFIGURAR);
  return firma;
}

/**
 * Sube directo a Cloudinary (§8) con la firma de Django. XMLHttpRequest y no fetch: es lo que da
 * el progreso de la subida.
 */
export function subirFoto(
  blob: Blob,
  firma: Firma,
  alProgreso: (fraccion: number) => void,
  senal?: AbortSignal,
): Promise<FotoApi> {
  return new Promise((resolver, rechazar) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${firma.cloud_name}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) alProgreso(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status === 401) return rechazar(new ErrorFirma());
      let datos: {
        public_id?: string;
        width?: number;
        height?: number;
        error?: { message?: string };
      } = {};
      try {
        datos = JSON.parse(xhr.responseText);
      } catch {
        // Respuesta sin JSON: se trata como error abajo.
      }
      if (xhr.status >= 200 && xhr.status < 300 && datos.public_id && datos.width && datos.height) {
        resolver({ public_id: datos.public_id, ancho: datos.width, alto: datos.height });
      } else {
        rechazar(
          new ErrorFoto(
            `Cloudinary rechazó la foto${datos.error?.message ? `: ${datos.error.message}` : "."}`,
          ),
        );
      }
    };
    xhr.onerror = () =>
      rechazar(new ErrorFoto("No se pudo subir. Revisá la conexión y reintentá."));
    senal?.addEventListener("abort", () => xhr.abort());
    const formulario = new FormData();
    formulario.append("file", blob);
    formulario.append("api_key", firma.api_key);
    formulario.append("timestamp", String(firma.timestamp));
    formulario.append("folder", firma.folder);
    formulario.append("signature", firma.signature);
    xhr.send(formulario);
  });
}
