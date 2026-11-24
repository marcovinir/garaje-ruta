import Link from "next/link";

import { rutaPanel } from "../rutaPanel";
import { BOTON_SECUNDARIO, TARJETA } from "../ui/estilos";

export function SinAcceso() {
  return (
    <section className={`${TARJETA} flex flex-col items-start gap-3 p-6`}>
      <h1 className="titulo text-3xl">No tenés acceso a esta sección</h1>
      <p className="text-tinta-suave">
        Tu usuario no tiene permiso para esto. Si lo necesitás, pedíselo a quien administra el
        garaje.
      </p>
      <Link href={rutaPanel("articulos")} className={BOTON_SECUNDARIO}>
        Volver a artículos
      </Link>
    </section>
  );
}
