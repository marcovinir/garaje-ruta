"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Paginacion } from "@/features/publico/filtros/Paginacion";
import { aQueryString } from "@/features/publico/filtros/filtrosDesdeUrl";
import { api } from "@/shared/api/navegador";
import type { Pagina } from "@/shared/api/tipos";

import { esFecha } from "../articulos/filtros";
import { useSesion } from "../auth/useSesion";
import { RequierePermiso } from "../estructura/RequierePermiso";
import { rutaPanel } from "../rutaPanel";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO, TARJETA } from "../ui/estilos";
import { useEscritorio } from "../ui/useEscritorio";
import { ACCIONES, type Autor, type Cambio, resumirCambio } from "./resumen";

const FECHA = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Costa_Rica",
});

function filtrosDe(params: Pick<URLSearchParams, "get">): Record<string, string> {
  const filtros: Record<string, string> = {};
  const accion = params.get("accion");
  if (accion && Object.hasOwn(ACCIONES, accion)) filtros.accion = accion;
  for (const clave of ["usuario", "articulo", "page"]) {
    const valor = params.get(clave);
    if (valor && /^[1-9]\d{0,15}$/.test(valor) && Number.isSafeInteger(Number(valor)))
      filtros[clave] = valor;
  }
  for (const clave of ["desde", "hasta"]) {
    const valor = params.get(clave);
    if (valor && esFecha(valor)) filtros[clave] = valor;
  }
  return filtros;
}

function FiltrosHistorial({ filtros, base }: { filtros: Record<string, string>; base: string }) {
  const router = useRouter();
  const [usuario, elegirUsuario] = useState(filtros.usuario ?? "");
  const autores = useQuery({
    queryKey: ["panel", "historial", "usuarios"],
    queryFn: () => api<Autor[]>("/panel/historial/usuarios/"),
  });
  const autorActivo =
    filtros.usuario && !autores.data?.some((a) => String(a.id) === filtros.usuario);

  return (
    <form
      aria-label="Filtros de historial"
      className={TARJETA + " grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4"}
      onSubmit={(evento) => {
        evento.preventDefault();
        const datos = new FormData(evento.currentTarget);
        router.replace(
          base + aQueryString(filtrosDe({ get: (clave) => String(datos.get(clave) ?? "") })),
        );
      }}
    >
      {filtros.articulo && <input type="hidden" name="articulo" value={filtros.articulo} />}
      <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
        Acción
        <select name="accion" className={CAMPO} defaultValue={filtros.accion ?? ""}>
          <option value="">Todas</option>
          {Object.entries(ACCIONES).map(([codigo, etiqueta]) => (
            <option key={codigo} value={codigo}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
        Usuario
        <select
          name="usuario"
          className={CAMPO}
          value={usuario}
          onChange={(e) => elegirUsuario(e.currentTarget.value)}
        >
          <option value="">Todos</option>
          {autorActivo && <option value={filtros.usuario}>Usuario #{filtros.usuario}</option>}
          {autores.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
        Desde
        <input type="date" name="desde" className={CAMPO} defaultValue={filtros.desde} />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
        Hasta
        <input type="date" name="hasta" className={CAMPO} defaultValue={filtros.hasta} />
      </label>
      {autores.isError && (
        <div className="flex flex-wrap items-center gap-2 sm:col-span-full">
          <p role="status">No pudimos cargar los usuarios.</p>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => autores.refetch()}>
            Reintentar usuarios
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:col-span-full">
        <button type="submit" className={BOTON_PRIMARIO}>
          Aplicar filtros
        </button>
        <Link href={base} className={BOTON_SECUNDARIO}>
          Limpiar filtros
        </Link>
        {filtros.articulo && (
          <span className="text-tinta-suave text-sm">Artículo #{filtros.articulo}</span>
        )}
      </div>
    </form>
  );
}

function DatosCambio({ cambio, puedeEditar }: { cambio: Cambio; puedeEditar: boolean }) {
  const { articulo } = cambio;
  return [
    <time key="fecha" dateTime={cambio.fecha}>
      {FECHA.format(new Date(cambio.fecha))}
    </time>,
    cambio.usuario.nombre,
    <strong key="accion">{cambio.accion_texto}</strong>,
    puedeEditar && articulo.id !== null ? (
      <Link
        key="articulo"
        className="text-rojo-oscuro font-semibold underline underline-offset-4"
        href={rutaPanel("articulos/" + articulo.id)}
      >
        {articulo.titulo}
      </Link>
    ) : (
      articulo.titulo
    ),
    <ul key="detalle" className="flex flex-col gap-1">
      {resumirCambio(cambio).map((linea, i) => (
        <li key={i}>{linea}</li>
      ))}
    </ul>,
  ];
}

const COLUMNAS = ["Fecha y hora", "Usuario", "Acción", "Artículo", "Detalle"];

function Cambios({ cambios }: { cambios: Cambio[] }) {
  const escritorio = useEscritorio();
  const { puede } = useSesion();
  return escritorio ? (
    <div className={TARJETA + " overflow-x-auto"}>
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">Cambios del inventario</caption>
        <thead className="bg-campo">
          <tr>
            {COLUMNAS.map((nombre) => (
              <th key={nombre} scope="col" className="px-3 py-3 last:w-[34%]">
                {nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cambios.map((cambio) => (
            <tr key={cambio.id} className="border-borde border-t align-top">
              {DatosCambio({ cambio, puedeEditar: puede("articulos.editar") }).map((dato, i) => (
                <td key={COLUMNAS[i]} className="px-3 py-3 break-words">
                  {dato}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <ul className="grid gap-3 md:grid-cols-2" aria-label="Cambios del inventario">
      {cambios.map((cambio) => (
        <li key={cambio.id} className={TARJETA + " min-w-0 p-4"}>
          <dl className="flex flex-col gap-2 text-sm break-words">
            {DatosCambio({ cambio, puedeEditar: puede("articulos.editar") }).map((dato, i) => (
              <div key={COLUMNAS[i]}>
                <dt className="text-tinta-suave font-semibold">{COLUMNAS[i]}</dt>
                <dd>{dato}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

function Contenido() {
  const filtros = filtrosDe(useSearchParams());
  const base = rutaPanel("historial");
  const consulta = useQuery({
    queryKey: ["panel", "historial", filtros],
    queryFn: () => api<Pagina<Cambio>>("/panel/historial/", { query: filtros }),
  });

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPagina
        titulo="Historial"
        descripcion="Cambios en el inventario, del más reciente al más antiguo."
      />
      <FiltrosHistorial key={aQueryString(filtros)} filtros={filtros} base={base} />
      {consulta.isError ? (
        <div className={TARJETA + " flex flex-col items-start gap-3 p-5"}>
          <p role="alert">No pudimos cargar el historial.</p>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => consulta.refetch()}>
            Reintentar
          </button>
        </div>
      ) : !consulta.data ? (
        <div aria-busy="true" role="status" className="bg-campo h-40 animate-pulse rounded-2xl">
          <span className="sr-only">Cargando historial</span>
        </div>
      ) : !consulta.data.results.length ? (
        <p className={TARJETA + " p-5"}>Todavía no hay cambios con esos filtros</p>
      ) : (
        <>
          <Cambios cambios={consulta.data.results} />
          <Paginacion base={base} filtros={filtros} total={consulta.data.count} />
        </>
      )}
    </div>
  );
}

export function PaginaHistorial() {
  return (
    <RequierePermiso codigo="historial.ver">
      <Contenido />
    </RequierePermiso>
  );
}
