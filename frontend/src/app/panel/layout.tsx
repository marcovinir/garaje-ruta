import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProveedorPanel } from "@/features/panel/consultas";
import { ProveedorAvisos } from "@/features/panel/ui/Avisos";
import { TemaPanel } from "@/features/panel/ui/TemaPanel";
import { SCRIPT_TEMA } from "@/features/panel/ui/scriptTema";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel · Garaje Ruta" },
  robots: { index: false, follow: false },
};

export default function LayoutPanel({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Modo oscuro (#113): se aplica antes de pintar el panel, sin destello. */}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      <TemaPanel />
      <ProveedorPanel>
        <ProveedorAvisos>{children}</ProveedorAvisos>
      </ProveedorPanel>
    </>
  );
}
