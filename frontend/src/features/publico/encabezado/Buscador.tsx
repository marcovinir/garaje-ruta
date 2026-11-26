"use client";

import { useRouter } from "next/navigation";
import { type FocusEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import type { Pagina, Tarjeta } from "@/shared/api/tipos";
import { colones } from "@/shared/lib/dinero";

const ESPERA_MS = 300;
const MINIMO = 2;
const POR_GRUPO = 4;

type Estado = "inactivo" | "cargando" | "listo" | "error";
type Opcion = { clave: string; texto: string; detalle?: string; ruta: string };

/** La búsqueda pública de siempre (título, marca, modelo, categoría y número de parte). */
async function sugerencias(q: string, tipo: "auto" | "repuesto", senal: AbortSignal) {
  const url = new URL("/api/v1/articulos/", window.location.origin);
  url.search = new URLSearchParams({ q, tipo, tamano: String(POR_GRUPO) }).toString();
  const respuesta = await fetch(url, { signal: senal });
  if (!respuesta.ok) throw new Error(`Búsqueda: ${respuesta.status}`);
  return ((await respuesta.json()) as Pagina<Tarjeta>).results.slice(0, POR_GRUPO);
}

const aOpcion = (t: Tarjeta): Opcion => ({
  clave: `${t.tipo}-${t.id}`,
  texto: t.titulo,
  detalle: colones(t.precio_colones),
  ruta: t.ruta,
});

/**
 * Buscador del encabezado (#115) con sugerencias mientras se escribe: 300 ms después de la última
 * tecla y con 2 letras o más, hasta 4 autos y 4 repuestos. Patrón combobox de ARIA (flechas,
 * Enter, Esc). Sin JavaScript, el formulario envía a /buscar como siempre.
 */
export function Buscador({ id, alElegir }: { id: string; alElegir?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<Estado>("inactivo");
  const [autos, setAutos] = useState<Opcion[]>([]);
  const [repuestos, setRepuestos] = useState<Opcion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const control = useRef<AbortController | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      clearTimeout(temporizador.current);
      control.current?.abort();
    },
    [],
  );

  const texto = q.trim();
  const opciones: Opcion[] = [
    ...autos,
    ...repuestos,
    {
      clave: "todos",
      texto: "Ver todos los resultados",
      ruta: `/buscar?q=${encodeURIComponent(texto)}`,
    },
  ];
  const idLista = `${id}-sugerencias`;
  const idOpcion = (i: number) => `${id}-opcion-${i}`;

  useEffect(() => {
    if (abierto && activo >= 0) {
      document.getElementById(id + "-opcion-" + activo)?.scrollIntoView?.({ block: "nearest" });
    }
  }, [abierto, activo, id]);

  function buscar(consulta: string) {
    // Solo cuenta la última búsqueda: la anterior se cancela y su respuesta se ignora.
    control.current?.abort();
    const c = new AbortController();
    control.current = c;
    setEstado("cargando");
    // Solo si el campo sigue con el foco: si la persona ya se fue, no se abre nada encima.
    if (document.activeElement === campo.current) setAbierto(true);
    Promise.all([
      sugerencias(consulta, "auto", c.signal),
      sugerencias(consulta, "repuesto", c.signal),
    ])
      .then(([a, r]) => {
        if (c.signal.aborted) return;
        setAutos(a.map(aOpcion));
        setRepuestos(r.map(aOpcion));
        setEstado("listo");
      })
      .catch(() => {
        if (!c.signal.aborted) setEstado("error");
      });
  }

  function alEscribir(valor: string) {
    setQ(valor);
    setActivo(-1);
    clearTimeout(temporizador.current);
    if (valor.trim().length < MINIMO) {
      control.current?.abort();
      setAbierto(false);
      setEstado("inactivo");
      return;
    }
    temporizador.current = setTimeout(() => buscar(valor.trim()), ESPERA_MS);
  }

  function cancelar() {
    clearTimeout(temporizador.current);
    control.current?.abort();
    setAbierto(false);
    setActivo(-1);
  }

  function ir(ruta: string) {
    cancelar();
    alElegir?.();
    router.push(ruta);
  }

  function alTeclear(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      // Con la lista abierta, el Esc es del buscador: no sigue (no cierra el menú del celular).
      if (abierto) e.preventDefault();
      cancelar();
      return;
    }
    if (!abierto) return;
    const n = opciones.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => (i + 1) % n);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === "Enter" && activo >= 0) {
      e.preventDefault();
      ir(opciones[activo].ruta);
    }
  }

  function alSalir(e: FocusEvent<HTMLFormElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) cancelar();
  }

  const grupo = (nombre: string, lista: Opcion[], desde: number) =>
    lista.length ? (
      <div role="group" aria-label={nombre} className="py-1">
        <p aria-hidden="true" className="text-tinta-suave px-3 py-1 text-xs font-bold uppercase">
          {nombre}
        </p>
        {lista.map((o, i) => fila(o, desde + i))}
      </div>
    ) : null;

  // Función y no componente: así React conserva los nodos entre teclas (aria-activedescendant).
  function fila(opcion: Opcion, indice: number) {
    return (
      <div
        key={opcion.clave}
        role="option"
        id={idOpcion(indice)}
        aria-selected={indice === activo}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => ir(opcion.ruta)}
        className="aria-selected:bg-campo hover:bg-campo flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3"
      >
        <span className="truncate">{opcion.texto}</span>
        {opcion.detalle ? (
          <span className="text-tinta-suave shrink-0 text-sm">{opcion.detalle}</span>
        ) : null}
      </div>
    );
  }

  const sinResultados = estado === "listo" && autos.length + repuestos.length === 0;
  const aviso =
    estado === "cargando"
      ? "Buscando…"
      : estado === "error"
        ? "No pudimos buscar. Probá de nuevo."
        : sinResultados
          ? `Sin resultados para «${texto}».`
          : "";

  return (
    <form
      role="search"
      aria-label="Buscar en el catálogo"
      action="/buscar"
      onSubmit={(e) => {
        e.preventDefault();
        if (texto) ir(`/buscar?q=${encodeURIComponent(texto)}`);
      }}
      onBlur={alSalir}
      className="relative flex min-w-0 flex-1"
    >
      <div className="bg-campo border-borde flex min-w-0 flex-1 gap-1.5 rounded-xl border p-1">
        <label htmlFor={id} className="sr-only">
          Buscar marca, modelo o pieza
        </label>
        <input
          ref={campo}
          id={id}
          name="q"
          type="search"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={abierto ? idLista : undefined}
          aria-activedescendant={abierto && activo >= 0 ? idOpcion(activo) : undefined}
          value={q}
          onChange={(e) => alEscribir(e.target.value)}
          onKeyDown={alTeclear}
          onFocus={() => {
            if (texto.length >= MINIMO && estado !== "inactivo") setAbierto(true);
          }}
          placeholder="Buscá marca, modelo o pieza…"
          className="placeholder:text-tinta-suave min-w-0 flex-1 bg-transparent px-3 text-base focus-visible:rounded-md"
        />
        <button
          type="submit"
          className="bg-rojo hover:bg-rojo-fuerte min-h-11 rounded-lg px-4 font-semibold text-white"
        >
          Buscar
        </button>
      </div>

      <p role="status" className="sr-only">
        {abierto ? aviso : ""}
      </p>
      {abierto ? (
        <div className="bg-tarjeta border-borde absolute inset-x-0 top-full z-40 mt-1.5 max-h-[min(70dvh,calc(100dvh-var(--sugerencias-top,10rem)-0.5rem))] overflow-y-auto overscroll-contain rounded-xl border p-1.5 shadow-lg">
          {aviso ? (
            <p aria-hidden="true" className="text-tinta-suave px-3 py-1 text-sm">
              {aviso}
            </p>
          ) : null}
          <div role="listbox" id={idLista} aria-label="Sugerencias">
            {grupo("Autos", autos, 0)}
            {grupo("Repuestos", repuestos, autos.length)}
            <div className="border-borde mt-1 border-t pt-1">
              {fila(opciones[opciones.length - 1], opciones.length - 1)}
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
