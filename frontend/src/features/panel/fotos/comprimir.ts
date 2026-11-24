/** Errores de una foto que se muestran tal cual junto a su miniatura. */
export class ErrorFoto extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorFoto";
  }
}

export const NO_SE_PUDO_LEER = "No pudimos leer esa foto. Probá con JPG o PNG.";

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad: number): Promise<Blob | null> {
  return new Promise((listo) => canvas.toBlob(listo, tipo, calidad));
}

/**
 * Comprime en el navegador antes de subir (§8): lado mayor 2000 px, WebP (o JPEG si el navegador
 * no lo codifica) a 0,8, con la orientación EXIF ya aplicada (`imageOrientation: "from-image"`).
 * Un HEIC que el navegador no decodifica, o algo que no es imagen, da `ErrorFoto`.
 */
export async function comprimir(
  archivo: File,
  { ladoMayor = 2000, calidad = 0.8 }: { ladoMayor?: number; calidad?: number } = {},
): Promise<{ blob: Blob; ancho: number; alto: number }> {
  if (!archivo.type.startsWith("image/")) throw new ErrorFoto(NO_SE_PUDO_LEER);
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new ErrorFoto(NO_SE_PUDO_LEER);
  }
  const escala = Math.min(1, ladoMayor / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new ErrorFoto(NO_SE_PUDO_LEER);
  contexto.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close?.();

  let blob = await aBlob(canvas, "image/webp", calidad);
  if (!blob || blob.type !== "image/webp") blob = await aBlob(canvas, "image/jpeg", calidad);
  if (!blob) throw new ErrorFoto(NO_SE_PUDO_LEER);
  return { blob, ancho, alto };
}
