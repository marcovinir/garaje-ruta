import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Contacto } from "@/features/publico/contacto/Contacto";
import { obtenerConfiguracion } from "@/shared/api/datos";

export const metadata: Metadata = {
  title: "Contacto y confianza",
  description:
    "Ubicación, horarios y condiciones del catálogo de autos usados y repuestos de Garaje Ruta.",
  alternates: { canonical: "/contacto" },
};

async function DatosDeContacto() {
  await connection();
  const configuracion = await obtenerConfiguracion().catch(() => null);
  return <Contacto configuracion={configuracion} />;
}

export default function PaginaContacto() {
  return (
    <Suspense fallback={<Contacto configuracion={null} />}>
      <DatosDeContacto />
    </Suspense>
  );
}
