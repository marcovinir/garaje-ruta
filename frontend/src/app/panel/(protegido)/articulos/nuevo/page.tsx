import type { Metadata } from "next";
import { Suspense } from "react";

import { PaginaNuevo } from "@/features/panel/formulario/PaginaNuevo";

export const metadata: Metadata = { title: "Nuevo artículo" };

// Depende de la sesión del navegador (ver el layout de `(protegido)`).
export const instant = false;

export default function Nuevo() {
  return (
    <Suspense>
      <PaginaNuevo />
    </Suspense>
  );
}
