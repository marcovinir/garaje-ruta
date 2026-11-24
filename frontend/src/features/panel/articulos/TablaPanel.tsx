"use client";

import { type ReactNode, useState } from "react";

import { Foto } from "@/features/publico/componentes/Foto";
import { colones } from "@/shared/lib/dinero";

import { EstadoFila, TituloFila, fechaCorta } from "./piezas";
import type { FilaPanel } from "./tipos";

type Columna = "titulo" | "precio" | "estado" | "actualizado";
type Orden = { columna: Columna; ascendente: boolean } | null;

const VALOR: Record<Columna, (f: FilaPanel) => string | number> = {
  titulo: (f) => f.titulo.toLocaleLowerCase("es"),
  precio: (f) => f.precio_colones,
  estado: (f) => (f.agotado ? "agotado" : f.estado),
  actualizado: (f) => f.actualizado_en,
};

function ordenar(filas: FilaPanel[], orden: Orden): FilaPanel[] {
  if (!orden) return filas;
  const valor = VALOR[orden.columna];
  return [...filas].sort((a, b) => {
    const [x, y] = [valor(a), valor(b)];
    const r = x < y ? -1 : x > y ? 1 : 0;
    return orden.ascendente ? r : -r;
  });
}

function Encabezado({
  columna,
  texto,
  orden,
  alOrdenar,
}: {
  columna: Columna;
  texto: string;
  orden: Orden;
  alOrdenar: (o: Orden) => void;
}) {
  const activa = orden?.columna === columna;
  return (
    <th
      scope="col"
      aria-sort={activa ? (orden.ascendente ? "ascending" : "descending") : "none"}
      className="px-3 py-2 text-left"
    >
      <button
        type="button"
        onClick={() => alOrdenar({ columna, ascendente: activa ? !orden.ascendente : true })}
        className="hover:text-tinta inline-flex min-h-11 items-center gap-1 font-semibold"
      >
        {texto}
        <span aria-hidden="true">{activa ? (orden.ascendente ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

/**
 * Escritorio: tabla con orden por columna (ordena la página cargada) y acciones en línea.
 */
export function TablaPanel({
  filas,
  puedeEditar,
  acciones,
}: {
  filas: FilaPanel[];
  puedeEditar: boolean;
  acciones?: (fila: FilaPanel) => ReactNode;
}) {
  const [orden, setOrden] = useState<Orden>(null);

  return (
    <div className="bg-tarjeta border-borde overflow-x-auto rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="text-tinta-suave border-borde border-b">
          <tr>
            <Encabezado columna="titulo" texto="Artículo" orden={orden} alOrdenar={setOrden} />
            <Encabezado columna="precio" texto="Precio" orden={orden} alOrdenar={setOrden} />
            <Encabezado columna="estado" texto="Estado" orden={orden} alOrdenar={setOrden} />
            <Encabezado
              columna="actualizado"
              texto="Actualizado"
              orden={orden}
              alOrdenar={setOrden}
            />
            {acciones ? (
              <th scope="col" className="px-3 py-2 text-right">
                Acciones
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {ordenar(filas, orden).map((fila) => (
            <tr key={fila.id} className="border-borde border-b last:border-b-0">
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 shrink-0 overflow-hidden rounded-lg">
                    <Foto foto={fila.foto} alt="" sizes="64px" />
                  </div>
                  <TituloFila fila={fila} puedeEditar={puedeEditar} />
                </div>
              </td>
              <td className="titulo px-3 py-2 text-lg whitespace-nowrap">
                {colones(fila.precio_colones)}
              </td>
              <td className="px-3 py-2">
                <EstadoFila fila={fila} />
              </td>
              <td className="text-tinta-suave px-3 py-2 whitespace-nowrap">
                {fechaCorta(fila.actualizado_en)}
              </td>
              {acciones ? <td className="px-3 py-2 text-right">{acciones(fila)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
