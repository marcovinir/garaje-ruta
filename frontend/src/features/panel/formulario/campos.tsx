"use client";

import type { ReactNode } from "react";
import { type FieldPath, get, type RegisterOptions, useFormContext } from "react-hook-form";

import { Campo, propsCampo } from "../ui/Campo";
import { CAMPO } from "../ui/estilos";
import type { ValoresFormulario } from "./esquema";

type Nombre = FieldPath<ValoresFormulario>;

export const idDe = (nombre: string) => `campo-${nombre.replaceAll(".", "-")}`;

function useCampo(nombre: Nombre) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ValoresFormulario>();
  const error = (get(errors, nombre) as { message?: string } | undefined)?.message;
  return { register, error, id: idDe(nombre) };
}

type Comunes = { nombre: Nombre; etiqueta: string; ayuda?: string; className?: string };

export function CampoTexto({
  nombre,
  etiqueta,
  ayuda,
  className,
  numerico = false,
  tipo = "text",
  placeholder,
}: Comunes & { numerico?: boolean; tipo?: "text" | "date"; placeholder?: string }) {
  const { register, error, id } = useCampo(nombre);
  return (
    <Campo id={id} etiqueta={etiqueta} error={error} ayuda={ayuda} className={className}>
      <input
        {...register(nombre)}
        {...propsCampo(id, error, ayuda)}
        type={tipo}
        inputMode={numerico ? "numeric" : undefined}
        placeholder={placeholder}
        className={CAMPO}
      />
    </Campo>
  );
}

export function CampoArea({ nombre, etiqueta, ayuda, className }: Comunes) {
  const { register, error, id } = useCampo(nombre);
  return (
    <Campo id={id} etiqueta={etiqueta} error={error} ayuda={ayuda} className={className}>
      <textarea
        {...register(nombre)}
        {...propsCampo(id, error, ayuda)}
        rows={4}
        className={`${CAMPO} py-2`}
      />
    </Campo>
  );
}

export type Opcion = { valor: string; texto: string };

export function CampoSeleccion({
  nombre,
  etiqueta,
  opciones,
  ayuda,
  className,
  vacio = "Elegí…",
  alCambiar,
  extra,
}: Comunes & {
  opciones: Opcion[];
  vacio?: string | null;
  alCambiar?: RegisterOptions<ValoresFormulario>["onChange"];
  extra?: ReactNode;
}) {
  const { register, error, id } = useCampo(nombre);
  return (
    <Campo id={id} etiqueta={etiqueta} error={error} ayuda={ayuda} className={className}>
      <div className="flex gap-2">
        <select
          {...register(nombre, { onChange: alCambiar })}
          {...propsCampo(id, error, ayuda)}
          className={CAMPO}
        >
          {vacio !== null ? <option value="">{vacio}</option> : null}
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
        {extra}
      </div>
    </Campo>
  );
}

export function CampoCasilla({ nombre, etiqueta }: { nombre: Nombre; etiqueta: string }) {
  const { register, id } = useCampo(nombre);
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3">
      <input {...register(nombre)} id={id} type="checkbox" className="accent-rojo size-5" />
      <span className="font-semibold">{etiqueta}</span>
    </label>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="bg-tarjeta border-borde flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:p-5">
      <legend className="sr-only">{titulo}</legend>
      <h2 aria-hidden="true" className="titulo text-2xl">
        {titulo}
      </h2>
      {children}
    </fieldset>
  );
}

export const REJILLA = "grid grid-cols-1 gap-4 sm:grid-cols-2";
