import type { ReactNode } from "react";

type Props = {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
};

/** Etiqueta visible, el control, la ayuda y el error junto al campo (§11, Nielsen). */
export function Campo({ id, etiqueta, error, ayuda, children, className = "" }: Props) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {ayuda ? (
        <p id={`${id}-ayuda`} className="text-tinta-suave text-sm">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-rojo-oscuro text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Atributos de accesibilidad del control que va dentro de `<Campo>`. */
export function propsCampo(id: string, error?: string, ayuda?: string) {
  const descripcion = [ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": descripcion || undefined,
  };
}
