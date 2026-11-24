import type { Metadata } from "next";

import { PaginaConfiguracion } from "@/features/panel/configuracion/PaginaConfiguracion";

export const metadata: Metadata = { title: "Configuración" };

// Depende de la sesión del navegador (ver el layout de `(protegido)`).
export const instant = false;

export default function Configuracion() {
  return <PaginaConfiguracion />;
}
