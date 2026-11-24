import { connection } from "next/server";
import { Suspense } from "react";

import { Encabezado } from "@/features/publico/componentes/Encabezado";
import { PieDePagina } from "@/features/publico/componentes/PieDePagina";
import { obtenerConfiguracion } from "@/shared/api/datos";

async function Pie() {
  await connection();
  const configuracion = await obtenerConfiguracion().catch(() => null);
  return <PieDePagina configuracion={configuracion} />;
}

export default function LayoutPublico({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenido"
        className="bg-carbon sr-only z-50 rounded-lg px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Encabezado />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Suspense fallback={<PieDePagina configuracion={null} />}>
        <Pie />
      </Suspense>
    </>
  );
}
