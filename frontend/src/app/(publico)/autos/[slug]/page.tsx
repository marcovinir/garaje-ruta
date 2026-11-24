import type { Metadata } from "next";

import { metadataFicha } from "@/features/publico/ficha/cargar";
import { RutaFicha } from "@/features/publico/ficha/PaginaFicha";

// El 308 a la URL canónica y el 404 los responde src/proxy.ts antes de renderizar.

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadataFicha((await params).slug);
}

export default function Ficha({ params }: Props) {
  return <RutaFicha seccion="autos" params={params} />;
}
