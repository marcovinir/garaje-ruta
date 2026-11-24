import type { Metadata } from "next";

import { PaginaUsuarios } from "@/features/panel/usuarios/PaginaUsuarios";

export const metadata: Metadata = { title: "Usuarios" };

// Depende de la sesión del navegador (ver el layout de `(protegido)`).
export const instant = false;

export default function Usuarios() {
  return <PaginaUsuarios />;
}
