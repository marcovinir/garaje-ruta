"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { mensajeDe } from "../auth/api";
import { useSesion } from "../auth/useSesion";
import { RequierePermiso } from "../estructura/RequierePermiso";
import { useAvisos } from "../ui/contextoAvisos";
import { Dialogo } from "../ui/Dialogo";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, TARJETA } from "../ui/estilos";
import {
  CLAVE_USUARIOS,
  NOMBRE_ROL,
  type UsuarioPanel,
  estadoUsuario,
  useUsuarios,
  usuariosApi,
} from "./api";
import { DialogoUsuario } from "./DialogoUsuario";

const ESTILO_ESTADO = {
  Activo: "bg-disponible text-disponible-tinta",
  "Pendiente de activar": "bg-reservado text-reservado-tinta",
  Desactivado: "bg-vendido text-vendido-tinta",
} as const;

function TarjetaUsuario({
  u,
  esYo,
  alEditar,
  alDesactivar,
}: {
  u: UsuarioPanel;
  esYo: boolean;
  alEditar: () => void;
  alDesactivar: () => void;
}) {
  const qc = useQueryClient();
  const { avisar } = useAvisos();
  const accion = useMutation({
    mutationFn: (tipo: "reactivar" | "reenviar") =>
      tipo === "reactivar" ? usuariosApi.reactivar(u.id) : usuariosApi.reenviar(u.id),
    onSuccess: (_, tipo) => {
      qc.invalidateQueries({ queryKey: CLAVE_USUARIOS });
      avisar(
        tipo === "reactivar"
          ? `${u.nombre} puede volver a entrar.`
          : `Invitación reenviada a ${u.email}.`,
      );
    },
    onError: (error) => avisar(mensajeDe(error), { tipo: "error" }),
  });
  const estado = estadoUsuario(u);
  const id = `usuario-${u.id}`;
  return (
    <article aria-labelledby={id} className={`${TARJETA} flex flex-col gap-3 p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h2 id={id} className="font-bold">
            {u.nombre} {u.apellidos}
            {esYo ? <span className="text-tinta-suave font-normal"> (vos)</span> : null}
          </h2>
          <p className="text-tinta-suave truncate text-sm">{u.email}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="bg-campo rounded-full px-2.5 py-1 text-xs font-semibold">
            {NOMBRE_ROL[u.rol]}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_ESTADO[estado]}`}
          >
            {estado}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className={BOTON_SECUNDARIO} onClick={alEditar}>
          Editar
        </button>
        {estado === "Pendiente de activar" ? (
          <button
            type="button"
            className={BOTON_SECUNDARIO}
            disabled={accion.isPending}
            onClick={() => accion.mutate("reenviar")}
          >
            Reenviar invitación
          </button>
        ) : null}
        {!u.is_active ? (
          <button
            type="button"
            className={BOTON_SECUNDARIO}
            disabled={accion.isPending}
            onClick={() => accion.mutate("reactivar")}
          >
            Reactivar
          </button>
        ) : !esYo ? (
          <button type="button" className={BOTON_SECUNDARIO} onClick={alDesactivar}>
            Desactivar
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Contenido() {
  const { yo } = useSesion();
  const qc = useQueryClient();
  const { avisar } = useAvisos();
  const usuarios = useUsuarios();
  const [editando, setEditando] = useState<UsuarioPanel | "nuevo" | null>(null);
  const [desactivando, setDesactivando] = useState<UsuarioPanel | null>(null);
  const desactivar = useMutation({
    mutationFn: (u: UsuarioPanel) => usuariosApi.desactivar(u.id),
    onSuccess: (u) => {
      qc.setQueryData(CLAVE_USUARIOS, (p: typeof usuarios.data) =>
        p ? { ...p, results: p.results.map((x) => (x.id === u.id ? u : x)) } : p,
      );
      avisar(`${u.nombre} ya no puede entrar al panel.`);
      setDesactivando(null);
    },
    onError: (error) => {
      avisar(mensajeDe(error), { tipo: "error" });
      setDesactivando(null);
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Quién puede entrar al panel y qué puede hacer."
        acciones={
          <button type="button" className={BOTON_PRIMARIO} onClick={() => setEditando("nuevo")}>
            Nuevo usuario
          </button>
        }
      />
      {usuarios.isError ? (
        <div className={`${TARJETA} flex flex-col items-start gap-3 p-5`}>
          <p role="alert">No pudimos cargar los usuarios.</p>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => usuarios.refetch()}>
            Reintentar
          </button>
        </div>
      ) : !usuarios.data ? (
        <div aria-busy="true" className="bg-campo h-64 animate-pulse rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {usuarios.data.results.map((u) => (
            <TarjetaUsuario
              key={u.id}
              u={u}
              esYo={u.id === yo?.id}
              alEditar={() => setEditando(u)}
              alDesactivar={() => setDesactivando(u)}
            />
          ))}
        </div>
      )}
      <DialogoUsuario
        abierto={editando !== null}
        usuario={editando && editando !== "nuevo" ? editando : undefined}
        alCerrar={() => setEditando(null)}
      />
      <Dialogo
        abierto={desactivando !== null}
        titulo={
          desactivando ? `¿Desactivar a ${desactivando.nombre} ${desactivando.apellidos}?` : ""
        }
        textoConfirmar="Desactivar"
        peligroso
        ocupado={desactivar.isPending}
        alConfirmar={() => desactivando && desactivar.mutate(desactivando)}
        alCerrar={() => setDesactivando(null)}
      >
        No va a poder entrar al panel hasta que lo reactivés. Lo que publicó se queda.
      </Dialogo>
    </div>
  );
}

export function PaginaUsuarios() {
  return (
    <RequierePermiso codigo="usuarios.gestionar">
      <Contenido />
    </RequierePermiso>
  );
}
