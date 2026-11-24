import type { Metadata } from "next";

import { metadataFicha } from "@/features/publico/ficha/cargar";
import { PaginaFicha } from "@/features/publico/ficha/PaginaFicha";

/**
 * La ficha espera sus datos (cacheados) antes de responder: así una URL vieja recibe un 308 real
 * y un id inexistente un 404, en vez de una redirección o un 404 en medio del streaming.
 */
export const instant = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataFicha((await params).slug);
}

export default async function Ficha({ params }: Props) {
  return <PaginaFicha seccion="autos" slug={(await params).slug} />;
}
