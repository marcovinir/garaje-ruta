import Image from "next/image";

import type { FotoApi } from "@/shared/api/tipos";
import cargadorImagenes from "@/shared/lib/cargador-imagenes";
import { FOTO_PENDIENTE } from "@/shared/lib/cloudinary";

type Props = {
  foto: FotoApi | null;
  alt: string;
  sizes: string;
  prioridad?: boolean;
  className?: string;
};

/** Foto 4:3 desde Cloudinary; sin foto, el marcador gris. Solo la foto LCP lleva prioridad. */
export function Foto({ foto, alt, sizes, prioridad = false, className = "" }: Props) {
  return (
    <Image
      loader={cargadorImagenes}
      src={foto?.public_id ?? FOTO_PENDIENTE}
      alt={alt}
      width={foto?.ancho ?? 400}
      height={foto ? Math.round((foto.ancho * 3) / 4) : 300}
      sizes={sizes}
      priority={prioridad}
      className={`aspect-[4/3] w-full object-cover ${className}`}
    />
  );
}
