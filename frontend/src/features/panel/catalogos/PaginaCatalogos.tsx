"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { ApiError, api } from "@/shared/api/navegador";

import { mensajeDe } from "../auth/api";
import { RequierePermiso } from "../estructura/RequierePermiso";
import { CLAVE_CATALOGOS } from "../formulario/api";
import { useAvisos } from "../ui/contextoAvisos";
import { Dialogo } from "../ui/Dialogo";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO, TARJETA } from "../ui/estilos";

type Relacion = {
  campo: "marca" | "padre" | "grupo";
  ruta: string;
  etiqueta: string;
  requerida: boolean;
};
type Definicion = {
  titulo: string;
  nuevo: string;
  ruta: string;
  relacion?: Relacion;
  filtrable?: boolean;
};

/** Catálogos del panel (`catalogos.gestionar`, §9), uno por pestaña. */
const DEFINICIONES: Definicion[] = [
  { titulo: "Marcas", nuevo: "Nueva marca", ruta: "marcas" },
  {
    titulo: "Modelos",
    nuevo: "Nuevo modelo",
    ruta: "modelos",
    relacion: { campo: "marca", ruta: "marcas", etiqueta: "Marca", requerida: true },
  },
  {
    titulo: "Categorías de pieza",
    nuevo: "Nueva categoría",
    ruta: "categorias-pieza",
    relacion: { campo: "padre", ruta: "categorias-pieza", etiqueta: "Dentro de", requerida: false },
  },
  { titulo: "Transmisiones", nuevo: "Nueva transmisión", ruta: "transmisiones" },
  { titulo: "Combustibles", nuevo: "Nuevo combustible", ruta: "combustibles" },
  { titulo: "Tracciones", nuevo: "Nueva tracción", ruta: "tracciones" },
  { titulo: "Carrocerías", nuevo: "Nueva carrocería", ruta: "carrocerias" },
  { titulo: "Grupos de equipamiento", nuevo: "Nuevo grupo", ruta: "grupos-equipamiento" },
  {
    titulo: "Equipamiento",
    nuevo: "Nuevo equipamiento",
    ruta: "equipamiento",
    relacion: { campo: "grupo", ruta: "grupos-equipamiento", etiqueta: "Grupo", requerida: true },
    filtrable: true,
  },
];

type Item = {
  id: number;
  nombre: string;
  marca?: number;
  padre?: number | null;
  grupo?: number;
  filtrable?: boolean;
};

const claveDe = (ruta: string) => ["panel", "catalogo", ruta] as const;

function useLista(ruta: string, activa = true) {
  return useQuery({
    queryKey: claveDe(ruta),
    queryFn: () => api<Item[]>(`/panel/${ruta}/`),
    enabled: activa,
  });
}

function Fila({
  item,
  def,
  nombreRelacion,
}: {
  item: Item;
  def: Definicion;
  nombreRelacion?: string;
}) {
  const qc = useQueryClient();
  const { avisar } = useAvisos();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(item.nombre);
  const [borrando, setBorrando] = useState(false);
  const refrescar = () => {
    qc.invalidateQueries({ queryKey: claveDe(def.ruta) });
    qc.invalidateQueries({ queryKey: CLAVE_CATALOGOS });
  };
  const cambiar = useMutation({
    mutationFn: (datos: Partial<Item>) =>
      api<Item>(`/panel/${def.ruta}/${item.id}/`, { metodo: "PATCH", cuerpo: datos }),
    onSuccess: () => {
      setEditando(false);
      refrescar();
    },
    onError: (error) => avisar(mensajeDe(error), { tipo: "error" }),
  });
  const borrar = useMutation({
    mutationFn: () => api(`/panel/${def.ruta}/${item.id}/`, { metodo: "DELETE" }),
    onSuccess: () => {
      setBorrando(false);
      avisar(`Eliminado: ${item.nombre}`);
      refrescar();
    },
    onError: (error) => {
      setBorrando(false);
      avisar(mensajeDe(error), { tipo: "error" });
    },
  });

  return (
    <li
      aria-label={item.nombre}
      className="border-borde flex flex-wrap items-center gap-2 border-b px-4 py-2 last:border-b-0"
    >
      {editando ? (
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (nombre.trim() && nombre.trim() !== item.nombre)
              cambiar.mutate({ nombre: nombre.trim() });
            else setEditando(false);
          }}
        >
          <input
            aria-label={`Nombre nuevo de ${item.nombre}`}
            value={nombre}
            autoFocus
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setEditando(false)}
            className={CAMPO}
          />
          <button type="submit" className={BOTON_PRIMARIO} disabled={cambiar.isPending}>
            Guardar
          </button>
        </form>
      ) : (
        <span className="min-w-0 flex-1">
          <span className="font-semibold">{item.nombre}</span>
          {nombreRelacion ? <span className="text-tinta-suave"> · {nombreRelacion}</span> : null}
        </span>
      )}
      {def.filtrable && !editando ? (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(item.filtrable)}
            onChange={(e) => cambiar.mutate({ filtrable: e.target.checked })}
            className="accent-rojo size-5"
          />
          En los filtros
        </label>
      ) : null}
      {!editando ? (
        <>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => setEditando(true)}>
            Renombrar
          </button>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => setBorrando(true)}>
            Eliminar
          </button>
        </>
      ) : null}
      <Dialogo
        abierto={borrando}
        titulo={`¿Eliminar «${item.nombre}»?`}
        textoConfirmar="Eliminar"
        peligroso
        ocupado={borrar.isPending}
        alConfirmar={() => borrar.mutate()}
        alCerrar={() => setBorrando(false)}
      >
        Si algún artículo lo usa, no se puede borrar: renombralo en su lugar.
      </Dialogo>
    </li>
  );
}

function Agregar({ def, opciones }: { def: Definicion; opciones: Item[] }) {
  const qc = useQueryClient();
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [relacion, setRelacion] = useState("");
  const crear = useMutation({
    mutationFn: () =>
      api<Item>(`/panel/${def.ruta}/`, {
        metodo: "POST",
        cuerpo: {
          nombre: nombre.trim(),
          ...(def.relacion ? { [def.relacion.campo]: relacion ? Number(relacion) : null } : {}),
        },
      }),
    onSuccess: () => {
      setNombre("");
      qc.invalidateQueries({ queryKey: claveDe(def.ruta) });
      qc.invalidateQueries({ queryKey: CLAVE_CATALOGOS });
    },
  });
  const error =
    crear.error instanceof ApiError
      ? Object.values(crear.error.campos).flat().join(" ") || crear.error.detalle
      : crear.error
        ? mensajeDe(crear.error)
        : null;
  const falta = !nombre.trim() || (def.relacion?.requerida && !relacion);
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!falta) crear.mutate();
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <label
          htmlFor={`${id}-nombre`}
          className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-semibold"
        >
          {def.nuevo}
          <input
            id={`${id}-nombre`}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={CAMPO}
          />
        </label>
        {def.relacion ? (
          <label
            htmlFor={`${id}-rel`}
            className="flex min-w-40 flex-col gap-1 text-sm font-semibold"
          >
            {def.relacion.etiqueta}
            <select
              id={`${id}-rel`}
              value={relacion}
              onChange={(e) => setRelacion(e.target.value)}
              className={CAMPO}
            >
              <option value="">{def.relacion.requerida ? "Elegí…" : "Ninguna"}</option>
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="submit"
          disabled={Boolean(falta) || crear.isPending}
          className={BOTON_PRIMARIO}
        >
          Agregar
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-rojo-oscuro text-sm font-semibold">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Lista({ def }: { def: Definicion }) {
  const lista = useLista(def.ruta);
  const relacion = useLista(def.relacion?.ruta ?? def.ruta, Boolean(def.relacion));
  const opciones = def.relacion ? (relacion.data ?? []) : [];
  const nombreDe = (id?: number | null) => opciones.find((o) => o.id === id)?.nombre;
  const items = [...(lista.data ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return (
    <div className="flex flex-col gap-4">
      <div className={`${TARJETA} p-4`}>
        <Agregar def={def} opciones={opciones} />
      </div>
      {lista.isError ? (
        <p role="alert">No pudimos cargar {def.titulo.toLowerCase()}.</p>
      ) : !lista.data ? (
        <div aria-busy="true" className="bg-campo h-40 animate-pulse rounded-2xl" />
      ) : (
        <ul className={TARJETA}>
          {items.map((item) => (
            <Fila
              key={item.id}
              item={item}
              def={def}
              nombreRelacion={def.relacion ? nombreDe(item[def.relacion.campo]) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Contenido() {
  const [activa, setActiva] = useState(0);
  const id = useId();
  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPagina
        titulo="Catálogos"
        descripcion="Las listas que se eligen al cargar un auto o un repuesto."
      />
      <div role="tablist" aria-label="Catálogos" className="flex flex-wrap gap-2">
        {DEFINICIONES.map((d, i) => (
          <button
            key={d.ruta}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === activa}
            aria-controls={`${id}-panel`}
            onClick={() => setActiva(i)}
            className={`min-h-11 rounded-full px-4 font-semibold ${
              i === activa ? "bg-carbon text-white" : "bg-tarjeta border-borde border"
            }`}
          >
            {d.titulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${activa}`}>
        <Lista key={DEFINICIONES[activa].ruta} def={DEFINICIONES[activa]} />
      </div>
    </div>
  );
}

export function PaginaCatalogos() {
  return (
    <RequierePermiso codigo="catalogos.gestionar">
      <Contenido />
    </RequierePermiso>
  );
}
