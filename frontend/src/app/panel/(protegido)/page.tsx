import { redirect } from "next/navigation";

import { rutaPanel } from "@/features/panel/rutaPanel";

export default function InicioPanel() {
  redirect(rutaPanel("articulos"));
}
