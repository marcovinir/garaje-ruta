import type { ReactNode } from "react";
import { Suspense } from "react";

import { GuardiaSesion } from "@/features/panel/estructura/GuardiaSesion";

// El panel espera la sesión (en el navegador) antes de mostrar nada: no hay navegación
// instantánea que validar.
export const instant = false;

export default function LayoutProtegido({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <GuardiaSesion>{children}</GuardiaSesion>
    </Suspense>
  );
}
