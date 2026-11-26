/** URLs de fotos en Cloudinary con transformaciones (formato y calidad automáticos). */

export const FOTO_PENDIENTE = "/marca/foto-pendiente.svg";

export type OpcionesFoto = { ancho?: number; alto?: number; recorte?: boolean; calidad?: "low" };

export function urlFoto(
  publicId: string,
  { ancho, alto, recorte, calidad }: OpcionesFoto = {},
): string {
  const nube = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  if (!nube) return FOTO_PENDIENTE;
  const partes = ["f_auto", calidad ? "q_auto:" + calidad : "q_auto"];
  if (ancho) partes.push(`w_${ancho}`);
  if (alto) partes.push(`h_${alto}`);
  if (recorte) partes.push("c_fill");
  return `https://res.cloudinary.com/${nube}/image/upload/${partes.join(",")}/${publicId}`;
}

/** JPG grande que el navegador descarga (fl_attachment) en vez de abrirlo: para subir a redes. */
export function urlDescarga(publicId: string, nombre: string): string {
  const nube = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  if (!nube) return FOTO_PENDIENTE;
  const partes = [`fl_attachment:${nombre}`, "f_jpg", "q_auto:good", "w_1600", "c_limit"];
  return `https://res.cloudinary.com/${nube}/image/upload/${partes.join(",")}/${publicId}`;
}
