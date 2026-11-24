import type { Metadata } from "next";

import { Listado, type ParamsUrl, canonicaListado } from "@/features/publico/filtros/Listado";

type Props = { searchParams: Promise<ParamsUrl> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    title: "Repuestos",
    description:
      "Repuestos nuevos y usados con su compatibilidad clara: buscá por la marca, el modelo y el año de tu vehículo.",
    alternates: { canonical: await canonicaListado("repuesto", searchParams) },
  };
}

export default function Repuestos({ searchParams }: Props) {
  return (
    <Listado
      tipo="repuesto"
      titulo="Repuestos"
      intro="Nuevos y usados. Usá «Buscar por vehículo» para ver solo los que le sirven al tuyo."
      searchParams={searchParams}
    />
  );
}
