"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { rutaPanel } from "../rutaPanel";
import { Campo, propsCampo } from "../ui/Campo";
import { BOTON_PRIMARIO, CAMPO } from "../ui/estilos";
import { mensajeDe, useLogin, useYo } from "./api";
import { destinoSeguro, esquemaLogin } from "./esquemas";
import { MarcoAcceso } from "./MarcoAcceso";

type Valores = z.infer<typeof esquemaLogin>;

export function PaginaLogin() {
  const router = useRouter();
  const busqueda = useSearchParams();
  const destino = destinoSeguro(busqueda.get("siguiente"), rutaPanel(), rutaPanel("articulos"));
  const { data: yo } = useYo();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Valores>({ resolver: zodResolver(esquemaLogin) });

  // Con sesión (o recién iniciada), al panel.
  useEffect(() => {
    if (yo) router.replace(destino);
  }, [yo, destino, router]);

  return (
    <MarcoAcceso titulo="Ingresar al panel">
      {busqueda.get("motivo") === "sesion" ? (
        <p className="bg-rojo-suave text-rojo-oscuro rounded-xl px-4 py-3 font-semibold">
          Tu sesión terminó. Entrá de nuevo.
        </p>
      ) : null}
      <form
        noValidate
        onSubmit={handleSubmit((v) => login.mutate(v))}
        className="flex flex-col gap-4"
      >
        <Campo id="correo" etiqueta="Correo" error={errors.email?.message}>
          <input
            {...register("email")}
            {...propsCampo("correo", errors.email?.message)}
            type="email"
            autoComplete="username"
            className={CAMPO}
          />
        </Campo>
        <Campo id="clave" etiqueta="Contraseña" error={errors.password?.message}>
          <input
            {...register("password")}
            {...propsCampo("clave", errors.password?.message)}
            type="password"
            autoComplete="current-password"
            className={CAMPO}
          />
        </Campo>
        {login.isError ? (
          <p role="alert" className="text-rojo-oscuro font-semibold">
            {mensajeDe(login.error)}
          </p>
        ) : null}
        <button type="submit" disabled={login.isPending} className={BOTON_PRIMARIO}>
          {login.isPending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      <Link
        href={rutaPanel("recuperar")}
        className="text-rojo-oscuro self-start font-semibold underline-offset-4 hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </MarcoAcceso>
  );
}
