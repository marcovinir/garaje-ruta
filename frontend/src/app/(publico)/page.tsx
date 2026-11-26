import { Suspense } from "react";

import { Esqueleto } from "@/features/publico/componentes/Esqueleto";
import { Beneficios, Hero } from "@/features/publico/inicio/Hero";
import {
  Carrocerias,
  Compatibilidad,
  Ofertas,
  RecienLlegados,
  ResumenContacto,
} from "@/features/publico/inicio/secciones";

export default function Inicio() {
  return (
    <>
      <Hero />
      <Beneficios />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-6">
        <Suspense fallback={null}>
          <Carrocerias />
        </Suspense>
        <Suspense fallback={<Esqueleto />}>
          <Ofertas />
        </Suspense>
        <Suspense fallback={<Esqueleto alto="h-40" />}>
          <Compatibilidad />
        </Suspense>
        <Suspense fallback={<Esqueleto />}>
          <RecienLlegados tipo="auto" />
        </Suspense>
        <Suspense fallback={<Esqueleto />}>
          <RecienLlegados tipo="repuesto" />
        </Suspense>
        <Suspense fallback={null}>
          <ResumenContacto />
        </Suspense>
      </div>
    </>
  );
}
