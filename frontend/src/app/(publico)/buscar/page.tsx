import type { Metadata } from "next";
import { Suspense } from "react";

import { Esqueleto } from "@/features/publico/componentes/Esqueleto";
import type { ParamsUrl } from "@/features/publico/filtros/Listado";
import { ResultadosBusqueda } from "@/features/publico/filtros/ResultadosBusqueda";

export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false, follow: true },
};

export default function Buscar({ searchParams }: { searchParams: Promise<ParamsUrl> }) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="titulo text-4xl sm:text-5xl">Buscar</h1>
      <Suspense fallback={<Esqueleto />}>
        <ResultadosBusqueda searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
