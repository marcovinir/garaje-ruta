import type { Metadata } from "next";
import { Saira, Saira_Condensed } from "next/font/google";

import { sitioUrl } from "@/shared/lib/rutas";

import "./globals.css";

const titulos = Saira_Condensed({
  variable: "--fuente-titulos",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const texto = Saira({
  variable: "--fuente-texto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(sitioUrl()),
  title: { default: "Garaje Ruta · Autos usados y repuestos", template: "%s · Garaje Ruta" },
  description:
    "Autos usados revisados y repuestos con compatibilidad clara en Heredia, Costa Rica. Precio en colones y su equivalente en dólares.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: el script del modo oscuro del panel (#113) pone data-tema en <html>
    // antes de hidratar. Solo silencia los atributos de este elemento, no los de sus hijos.
    <html
      lang="es"
      className={`${titulos.variable} ${texto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-fondo text-tinta flex min-h-full flex-col">{children}</body>
    </html>
  );
}
