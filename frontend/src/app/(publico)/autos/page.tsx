import type { Metadata } from "next";

import { Listado, type ParamsUrl } from "@/features/publico/filtros/Listado";

export const metadata: Metadata = {
  title: "Autos usados",
  description:
    "Autos usados revisados en Heredia: filtrá por marca, año, precio y equipamiento. Precio en colones y en dólares.",
  alternates: { canonical: "/autos" },
};

export default function Autos({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  return (
    <Listado
      tipo="auto"
      titulo="Autos usados"
      intro="Todos revisados en el taller. Filtrá por marca, año, precio o equipamiento y consultá por WhatsApp."
      searchParams={searchParams}
    />
  );
}
