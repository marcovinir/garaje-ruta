"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError, camposPlanos } from "@/shared/api/navegador";

import { mensajeDe } from "../auth/api";
import { Campo, propsCampo } from "../ui/Campo";
import { useAvisos } from "../ui/contextoAvisos";
import { Dialogo } from "../ui/Dialogo";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO } from "../ui/estilos";
import { CLAVE_USUARIOS, NOMBRE_ROL, type UsuarioPanel, usuariosApi } from "./api";

const esquema = z.object({
  email: z.string().trim().email("Escribí un correo válido."),
  nombre: z.string().trim().min(1, "Completá este campo.").max(100),
  apellidos: z.string().trim().min(1, "Completá este campo.").max(150),
  rol: z.enum(["admin", "colaborador", "demo"]),
});
type Valores = z.infer<typeof esquema>;

const AYUDA_ROL = "El rol no se cambia: creá otro usuario si hace falta.";

/** Crear (correo, nombre, apellidos, rol) o editar (nombre y apellidos: el rol no cambia). */
export function DialogoUsuario({
  abierto,
  usuario,
  alCerrar,
}: {
  abierto: boolean;
  usuario?: UsuarioPanel;
  alCerrar: () => void;
}) {
  const qc = useQueryClient();
  const { avisar } = useAvisos();
  const [general, setGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(esquema),
    values: usuario
      ? {
          email: usuario.email,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          rol: usuario.rol,
        }
      : { email: "", nombre: "", apellidos: "", rol: "colaborador" },
  });

  const guardar = useMutation({
    mutationFn: (v: Valores) =>
      usuario
        ? usuariosApi.editar(usuario.id, { nombre: v.nombre, apellidos: v.apellidos })
        : usuariosApi.crear(v),
    onSuccess: (guardado) => {
      qc.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      avisar(
        usuario
          ? `Guardado: ${guardado.nombre} ${guardado.apellidos}`
          : `Le enviamos la invitación a ${guardado.email}.`,
      );
      reset();
      alCerrar();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        const sueltos: string[] = [];
        for (const [campo, mensajes] of Object.entries(camposPlanos(error.campos))) {
          if (campo in esquema.shape)
            setError(campo as keyof Valores, { message: mensajes.join(" ") });
          else sueltos.push(...mensajes);
        }
        setGeneral(sueltos.length ? sueltos.join(" ") : null);
        return;
      }
      setGeneral(mensajeDe(error));
    },
  });

  const titulo = usuario ? `Editar a ${usuario.nombre}` : "Nuevo usuario";
  return (
    <Dialogo abierto={abierto} titulo={titulo} alCerrar={alCerrar}>
      <form
        noValidate
        onSubmit={handleSubmit((v) => {
          setGeneral(null);
          guardar.mutate(v);
        })}
        className="text-tinta flex flex-col gap-4"
      >
        <Campo id="usuario-email" etiqueta="Correo" error={errors.email?.message}>
          <input
            {...register("email")}
            {...propsCampo("usuario-email", errors.email?.message)}
            type="email"
            readOnly={Boolean(usuario)}
            className={CAMPO}
          />
        </Campo>
        <Campo id="usuario-nombre" etiqueta="Nombre" error={errors.nombre?.message}>
          <input
            {...register("nombre")}
            {...propsCampo("usuario-nombre", errors.nombre?.message)}
            className={CAMPO}
          />
        </Campo>
        <Campo id="usuario-apellidos" etiqueta="Apellidos" error={errors.apellidos?.message}>
          <input
            {...register("apellidos")}
            {...propsCampo("usuario-apellidos", errors.apellidos?.message)}
            className={CAMPO}
          />
        </Campo>
        <Campo id="usuario-rol" etiqueta="Rol" ayuda={usuario ? AYUDA_ROL : undefined}>
          <select
            {...register("rol")}
            {...propsCampo("usuario-rol", undefined, usuario ? AYUDA_ROL : undefined)}
            disabled={Boolean(usuario)}
            className={CAMPO}
          >
            {(["colaborador", "admin", "demo"] as const).map((rol) => (
              <option key={rol} value={rol}>
                {NOMBRE_ROL[rol]}
              </option>
            ))}
          </select>
        </Campo>
        {general ? (
          <p role="alert" className="text-rojo-oscuro font-semibold">
            {general}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className={BOTON_SECUNDARIO} onClick={alCerrar}>
            Cancelar
          </button>
          <button type="submit" disabled={guardar.isPending} className={BOTON_PRIMARIO}>
            {usuario ? "Guardar" : "Crear y enviar invitación"}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}
