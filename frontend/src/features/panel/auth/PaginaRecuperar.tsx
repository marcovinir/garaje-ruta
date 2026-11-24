"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { rutaPanel } from "../rutaPanel";
import { Campo, propsCampo } from "../ui/Campo";
import { BOTON_PRIMARIO, CAMPO } from "../ui/estilos";
import { mensajeDe, useRecuperar } from "./api";
import { esquemaRecuperar } from "./esquemas";
import { MarcoAcceso } from "./MarcoAcceso";

type Valores = z.infer<typeof esquemaRecuperar>;

const ENLACE = "text-rojo-oscuro self-start font-semibold underline-offset-4 hover:underline";

export function PaginaRecuperar() {
  const recuperar = useRecuperar();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({ resolver: zodResolver(esquemaRecuperar) });

  return (
    <MarcoAcceso titulo="Recuperar el acceso">
      {recuperar.isSuccess ? (
        <p role="status">
          Si el correo está registrado, te llegará un enlace para crear una contraseña nueva. Revisá
          también el correo no deseado.
        </p>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit((v) => recuperar.mutate(v))}
          className="flex flex-col gap-4"
        >
          <Campo id="correo-recuperar" etiqueta="Correo" error={errors.email?.message}>
            <input
              {...register("email")}
              {...propsCampo("correo-recuperar", errors.email?.message)}
              type="email"
              autoComplete="email"
              className={CAMPO}
            />
          </Campo>
          {recuperar.isError ? (
            <p role="alert" className="text-rojo-oscuro font-semibold">
              {mensajeDe(recuperar.error)}
            </p>
          ) : null}
          <button type="submit" disabled={recuperar.isPending} className={BOTON_PRIMARIO}>
            Enviar enlace
          </button>
        </form>
      )}
      <Link href={rutaPanel("login")} className={ENLACE}>
        Volver a ingresar
      </Link>
    </MarcoAcceso>
  );
}
