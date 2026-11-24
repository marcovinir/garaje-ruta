import type { Metadata } from "next";

import { PaginaCatalogos } from "@/features/panel/catalogos/PaginaCatalogos";

export const metadata: Metadata = { title: "Catálogos" };

// Depende de la sesión del navegador (ver el layout de `(protegido)`).
export const instant = false;

export default function Catalogos() {
  return <PaginaCatalogos />;
}
