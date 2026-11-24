/** Bloque gris que ocupa el lugar del contenido mientras llega (evita saltos de diseño). */
export function Esqueleto({
  alto = "h-72",
  className = "",
}: {
  alto?: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`bg-campo ${alto} animate-pulse rounded-2xl ${className}`} />
  );
}
