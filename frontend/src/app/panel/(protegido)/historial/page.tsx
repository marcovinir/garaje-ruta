import type { Metadata } from "next";
import { Suspense } from "react";

import { PaginaHistorial } from "@/features/panel/historial/PaginaHistorial";

export const metadata: Metadata = { title: "Historial" };
export const instant = false;

export default function Historial() {
  return (
    <Suspense>
      <PaginaHistorial />
    </Suspense>
  );
}
