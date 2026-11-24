type Props = { texto?: string };

export function MensajeError({
  texto = "No pudimos cargar el catálogo. Probá de nuevo en un momento.",
}: Props) {
  return (
    <p
      role="status"
      className="bg-tarjeta border-borde text-tinta-suave rounded-2xl border px-5 py-6 text-center"
    >
      {texto}
    </p>
  );
}
