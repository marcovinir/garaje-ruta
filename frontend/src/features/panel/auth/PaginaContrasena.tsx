"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ApiError } from "@/shared/api/navegador";

import { rutaPanel } from "../rutaPanel";
import { Campo, propsCampo } from "../ui/Campo";
import { BOTON_PRIMARIO, CAMPO } from "../ui/estilos";
import { type ModoContrasena, mensajeDe, useEstablecerContrasena } from "./api";
import { esquemaContrasena } from "./esquemas";
import { MarcoAcceso } from "./MarcoAcceso";

type Valores = z.infer<typeof esquemaContrasena>;

const TEXTOS = {
  activar: {
    titulo: "Activar tu cuenta",
    boton: "Activar mi cuenta",
    listo: "Tu cuenta está activa.",
  },
  restablecer: {
    titulo: "Contraseña nueva",
    boton: "Guardar contraseña",
    listo: "Tu contraseña se cambió.",
  },
} as const;

const ENLACE = "text-rojo-oscuro font-semibold underline-offset-4 hover:underline";

export function PaginaContrasena({
  modo,
  uid,
  token,
}: {
  modo: ModoContrasena;
  uid: string;
  token: string;
}) {
  const texto = TEXTOS[modo];
  const establecer = useEstablecerContrasena(modo);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({ resolver: zodResolver(esquemaContrasena) });

  // Las reglas de Django (contraseña común, muy parecida al correo…) llegan en `campos.password`.
  const errorDjango =
    establecer.error instanceof ApiError
      ? (establecer.error.campos.password as string[] | undefined)?.join(" ")
      : undefined;

  if (establecer.isSuccess) {
    return (
      <MarcoAcceso titulo={texto.titulo}>
        <p role="status">{texto.listo} Ya podés ingresar.</p>
        <Link href={rutaPanel("login")} className={ENLACE}>
          Ir a ingresar
        </Link>
      </MarcoAcceso>
    );
  }

  return (
    <MarcoAcceso titulo={texto.titulo}>
      <form
        noValidate
        onSubmit={handleSubmit((v) => establecer.mutate({ uid, token, password: v.password }))}
        className="flex flex-col gap-4"
      >
        <Campo
          id="clave-nueva"
          etiqueta="Contraseña nueva"
          ayuda="Al menos 8 caracteres; mejor una frase que solo vos sepás."
          error={errors.password?.message ?? errorDjango}
        >
          <input
            {...register("password")}
            {...propsCampo(
              "clave-nueva",
              errors.password?.message ?? errorDjango,
              "Al menos 8 caracteres; mejor una frase que solo vos sepás.",
            )}
            type="password"
            autoComplete="new-password"
            className={CAMPO}
          />
        </Campo>
        <Campo
          id="clave-repetida"
          etiqueta="Repetir la contraseña"
          error={errors.confirmar?.message}
        >
          <input
            {...register("confirmar")}
            {...propsCampo("clave-repetida", errors.confirmar?.message)}
            type="password"
            autoComplete="new-password"
            className={CAMPO}
          />
        </Campo>
        {establecer.isError && !errorDjango ? (
          <div role="alert" className="flex flex-col gap-1">
            <p className="text-rojo-oscuro font-semibold">{mensajeDe(establecer.error)}</p>
            <Link href={rutaPanel("recuperar")} className={ENLACE}>
              Pedir un enlace nuevo
            </Link>
          </div>
        ) : null}
        <button type="submit" disabled={establecer.isPending} className={BOTON_PRIMARIO}>
          {texto.boton}
        </button>
      </form>
    </MarcoAcceso>
  );
}
