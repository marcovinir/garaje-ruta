import type { Metadata } from "next";

import { Listado, type ParamsUrl } from "@/features/publico/filtros/Listado";

export const metadata: Metadata = {
  title: "Repuestos",
  description:
    "Repuestos nuevos y usados con su compatibilidad clara: buscá por la marca, el modelo y el año de tu vehículo.",
  alternates: { canonical: "/repuestos" },
};

export default function Repuestos({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  return (
    <Listado
      tipo="repuesto"
      titulo="Repuestos"
      intro="Nuevos y usados. Usá «Buscar por vehículo» para ver solo los que le sirven al tuyo."
      searchParams={searchParams}
    />
  );
}
