import type { Metadata } from "next";
import { Suspense } from "react";

import { PaginaReportes } from "@/features/panel/reportes/PaginaReportes";

export const metadata: Metadata = { title: "Reportes" };
export const instant = false;

export default function Reportes() {
  return (
    <Suspense>
      <PaginaReportes />
    </Suspense>
  );
}
