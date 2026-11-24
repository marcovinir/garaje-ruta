import { Suspense } from "react";

import { Esqueleto } from "@/features/publico/componentes/Esqueleto";
import { Accesos, Carrocerias, Destacados, Ofertas } from "@/features/publico/inicio/secciones";

export default function Inicio() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-6" aria-labelledby="titular">
        <p className="text-rojo-oscuro text-sm font-semibold tracking-widest">
          PATIO DE AUTOS USADOS · HEREDIA
        </p>
        <h1 id="titular" className="titulo max-w-3xl text-5xl leading-[0.95] sm:text-7xl">
          Autos revisados y repuestos con su compatibilidad clara
        </h1>
        <p className="text-tinta-suave max-w-xl text-lg">
          Precio en colones y su equivalente en dólares. Consultás por WhatsApp con un clic.
        </p>
        <Suspense fallback={<Esqueleto alto="h-20" />}>
          <Accesos />
        </Suspense>
        <Suspense fallback={null}>
          <Carrocerias />
        </Suspense>
      </section>
      <Suspense fallback={<Esqueleto />}>
        <Ofertas />
      </Suspense>
      <Suspense fallback={<Esqueleto />}>
        <Destacados />
      </Suspense>
    </div>
  );
}
