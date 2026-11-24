"use client";

import { useRouter } from "next/navigation";

import { rutaPanel } from "../rutaPanel";
import { CAMPO } from "../ui/estilos";
import { type FiltrosPanel as Filtros, conFiltro } from "./filtros";

const ETIQUETA = "text-sm font-semibold";

/** Filtros del listado; cada cambio va a la URL (se puede volver atrás y compartir). */
export function FiltrosPanel({ filtros }: { filtros: Filtros }) {
  const router = useRouter();
  const ir = (clave: keyof Filtros, valor: string) =>
    router.replace(`${rutaPanel("articulos")}${conFiltro(filtros, clave, valor)}`);

  return (
    <div className="flex flex-col gap-3">
      <form
        role="search"
        // Al cambiar `q` desde la URL el campo se vuelve a montar con el valor nuevo.
        key={filtros.q ?? ""}
        onSubmit={(e) => {
          e.preventDefault();
          ir("q", String(new FormData(e.currentTarget).get("q") ?? "").trim());
        }}
        className="flex gap-2"
      >
        <input
          type="search"
          name="q"
          aria-label="Buscar en el inventario"
          placeholder="Título, código o número de parte"
          defaultValue={filtros.q ?? ""}
          className={CAMPO}
        />
        <button
          type="submit"
          className="bg-carbon min-h-11 rounded-xl px-4 font-semibold text-white"
        >
          Buscar
        </button>
      </form>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="flex min-w-0 flex-col gap-1">
          <span className={ETIQUETA}>Tipo</span>
          <select
            value={filtros.tipo ?? ""}
            onChange={(e) => ir("tipo", e.target.value)}
            className={CAMPO}
          >
            <option value="">Todos</option>
            <option value="auto">Autos</option>
            <option value="repuesto">Repuestos</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className={ETIQUETA}>Estado</span>
          <select
            value={filtros.estado ?? ""}
            onChange={(e) => ir("estado", e.target.value)}
            className={CAMPO}
          >
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="reservado">Reservado</option>
            <option value="oculto">Oculto</option>
            <option value="vendido">Vendido</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className={ETIQUETA}>Orden</span>
          <select
            value={filtros.orden ?? ""}
            onChange={(e) => ir("orden", e.target.value)}
            className={CAMPO}
          >
            <option value="">Recién publicados</option>
            <option value="actualizados">Últimos cambios</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className={ETIQUETA}>Publicado desde</span>
          <input
            type="date"
            value={filtros.desde ?? ""}
            onChange={(e) => ir("desde", e.target.value)}
            className={CAMPO}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className={ETIQUETA}>Publicado hasta</span>
          <input
            type="date"
            value={filtros.hasta ?? ""}
            onChange={(e) => ir("hasta", e.target.value)}
            className={CAMPO}
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end">
          <input
            type="checkbox"
            checked={filtros.agotado === "1"}
            onChange={(e) => ir("agotado", e.target.checked ? "1" : "")}
            className="accent-rojo size-5"
          />
          <span className="font-semibold">Solo agotados</span>
        </label>
      </div>
    </div>
  );
}
