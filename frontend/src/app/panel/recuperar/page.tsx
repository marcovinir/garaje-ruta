import type { Metadata } from "next";

import { PaginaRecuperar } from "@/features/panel/auth/PaginaRecuperar";

export const metadata: Metadata = { title: "Recuperar el acceso" };

export default function Recuperar() {
  return <PaginaRecuperar />;
}
