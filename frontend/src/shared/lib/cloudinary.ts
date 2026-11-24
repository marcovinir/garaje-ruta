/** URLs de fotos en Cloudinary con transformaciones (formato y calidad automáticos). */

export const FOTO_PENDIENTE = "/marca/foto-pendiente.svg";

export type OpcionesFoto = { ancho?: number; alto?: number; recorte?: boolean };

export function urlFoto(publicId: string, { ancho, alto, recorte }: OpcionesFoto = {}): string {
  const nube = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
  if (!nube) return FOTO_PENDIENTE;
  const partes = ["f_auto", "q_auto"];
  if (ancho) partes.push(`w_${ancho}`);
  if (alto) partes.push(`h_${alto}`);
  if (recorte) partes.push("c_fill");
  return `https://res.cloudinary.com/${nube}/image/upload/${partes.join(",")}/${publicId}`;
}
