/** Clases compartidas del panel (mismos tokens de la web, `globals.css`). */

export const CAMPO =
  "bg-campo border-borde-campo text-tinta min-h-11 w-full min-w-0 rounded-xl border px-3 aria-[invalid=true]:border-rojo-oscuro";

const BOTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold disabled:cursor-not-allowed disabled:opacity-60";

export const BOTON_PRIMARIO = `${BOTON} bg-rojo hover:bg-rojo-oscuro text-white`;
export const BOTON_SECUNDARIO = `${BOTON} border-borde bg-tarjeta hover:border-tinta border`;
export const BOTON_PELIGRO = `${BOTON} bg-rojo-oscuro hover:bg-tinta text-white`;
export const BOTON_TENUE = `${BOTON} text-tinta-suave hover:bg-campo hover:text-tinta`;

export const TARJETA = "bg-tarjeta border-borde rounded-2xl border";
