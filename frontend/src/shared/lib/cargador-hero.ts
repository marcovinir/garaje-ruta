"use client";

import { urlFoto } from "./cloudinary";

/** El fondo del hero lleva una capa oscura; admite una compresión más fuerte. */
export default function cargadorHero({ src, width }: { src: string; width: number }) {
  return urlFoto(src, { ancho: width, calidad: "low" });
}
