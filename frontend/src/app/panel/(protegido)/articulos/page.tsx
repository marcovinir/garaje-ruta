import type { Metadata } from "next";
import { Suspense } from "react";

import { PaginaArticulos } from "@/features/panel/articulos/PaginaArticulos";

export const metadata: Metadata = { title: "Artículos" };

// Depende de la sesión del navegador (ver el layout de `(protegido)`).
export const instant = false;

export default function Articulos() {
  return (
    <Suspense>
      <PaginaArticulos />
    </Suspense>
  );
}
