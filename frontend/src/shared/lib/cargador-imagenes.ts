"use client";

import { urlFoto } from "./cloudinary";

/** Cargador de next/image: las fotos son public_id de Cloudinary; las rutas locales pasan tal cual. */
export default function cargadorImagenes({ src, width }: { src: string; width: number }): string {
  if (src.startsWith("/")) return src;
  return urlFoto(src, { ancho: width });
}
