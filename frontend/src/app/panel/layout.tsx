import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ProveedorPanel } from "@/features/panel/consultas";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel · Garaje Ruta" },
  robots: { index: false, follow: false },
};

export default function LayoutPanel({ children }: { children: ReactNode }) {
  return <ProveedorPanel>{children}</ProveedorPanel>;
}
