import type { Metadata } from "next";

import { Listado, type ParamsUrl, canonicaListado } from "@/features/publico/filtros/Listado";

type Props = { searchParams: Promise<ParamsUrl> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    title: "Autos usados",
    description:
      "Autos usados revisados en Heredia: filtrá por marca, año, precio y equipamiento. Precio en colones y en dólares.",
    alternates: { canonical: await canonicaListado("auto", searchParams) },
  };
}

export default function Autos({ searchParams }: Props) {
  return (
    <Listado
      tipo="auto"
      titulo="Autos usados"
      intro="Todos revisados en el taller. Filtrá por marca, año, precio o equipamiento y consultá por WhatsApp."
      searchParams={searchParams}
    />
  );
}
