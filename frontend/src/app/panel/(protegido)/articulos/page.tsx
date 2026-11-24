import type { Metadata } from "next";

import { EncabezadoPagina } from "@/features/panel/ui/EncabezadoPagina";

export const metadata: Metadata = { title: "Artículos" };

// Provisional: el listado llega en la tarea 4 (#70).
export default function Articulos() {
  return <EncabezadoPagina titulo="Artículos" />;
}
