"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { compartirEnlace } from "@/shared/lib/compartir";

import { mensajeDe } from "../auth/api";
import { useSesion } from "../auth/useSesion";
import { rutaPanel } from "../rutaPanel";
import { Campo } from "../ui/Campo";
import { useAvisos } from "../ui/contextoAvisos";
import { Dialogo } from "../ui/Dialogo";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO } from "../ui/estilos";
import { A_LA_VENTA, accionesApi, reemplazarFila, transiciones } from "./acciones";
import { CLAVE_ARTICULOS } from "./api";
import type { EstadoArticulo, FilaPanel } from "./tipos";

const OPCION =
  "hover:bg-campo flex min-h-11 w-full items-center rounded-lg px-3 text-left font-semibold";

/**
 * Acciones rápidas de una fila: vender (con «Deshacer» en el aviso), editar, compartir y el menú
 * «Más» con estados, duplicar y eliminar. Cada acción se muestra solo con su permiso (§9).
 */
export function BarraAcciones({ fila }: { fila: FilaPanel }) {
  const { puede } = useSesion();
  const qc = useQueryClient();
  const router = useRouter();
  const { avisar } = useAvisos();
  const idMenu = useId();
  const [menu, setMenu] = useState(false);
  const [vendiendoVarios, setVendiendoVarios] = useState(false);
  const [cantidad, setCantidad] = useState("1");
  const [eliminando, setEliminando] = useState(false);

  const alFallar = (error: unknown) => {
    avisar(mensajeDe(error), { tipo: "error" });
    qc.invalidateQueries({ queryKey: CLAVE_ARTICULOS });
  };

  const deshacer = useMutation({
    mutationFn: () => accionesApi.deshacerVenta(fila.id),
    onSuccess: (nueva) => {
      reemplazarFila(qc, nueva);
      avisar("Venta deshecha.");
    },
    onError: alFallar,
  });
  const vender = useMutation({
    mutationFn: (n: number) => accionesApi.vender(fila.id, n),
    onSuccess: ({ articulo }, n) => {
      reemplazarFila(qc, articulo);
      setVendiendoVarios(false);
      avisar(n > 1 ? `Vendidos ${n}: ${fila.titulo}` : `Vendido: ${fila.titulo}`, {
        accion: { etiqueta: "Deshacer", alHacer: () => deshacer.mutate() },
      });
    },
    onError: (error) => {
      setVendiendoVarios(false);
      alFallar(error);
    },
  });
  const estado = useMutation({
    mutationFn: (nuevo: EstadoArticulo) => accionesApi.cambiarEstado(fila.id, nuevo),
    onSuccess: (nueva) => reemplazarFila(qc, nueva),
    onError: alFallar,
  });
  const duplicar = useMutation({
    mutationFn: () => accionesApi.duplicar(fila.id),
    onSuccess: ({ id }) => {
      avisar("Copia creada: queda oculta hasta que la revisés.");
      qc.invalidateQueries({ queryKey: CLAVE_ARTICULOS });
      router.push(rutaPanel(`articulos/${id}`));
    },
    onError: alFallar,
  });
  const eliminar = useMutation({
    mutationFn: () => accionesApi.eliminar(fila.id),
    onSuccess: () => {
      setEliminando(false);
      avisar(`Eliminado: ${fila.titulo}`);
      qc.invalidateQueries({ queryKey: CLAVE_ARTICULOS });
    },
    onError: (error) => {
      setEliminando(false);
      alFallar(error);
    },
  });

  const puedeVender = puede("ventas.registrar");
  const aLaVenta = A_LA_VENTA.includes(fila.estado);
  const esAuto = fila.tipo === "auto";
  const stock = fila.cantidad ?? 0;
  const cambios = puede("articulos.cambiar_estado") ? transiciones(fila.estado) : [];
  const opciones = [
    ...cambios.map((c) => ({ etiqueta: c.etiqueta, hacer: () => estado.mutate(c.estado) })),
    ...(puedeVender && !esAuto && aLaVenta && stock > 1
      ? [{ etiqueta: "Vendí varios…", hacer: () => setVendiendoVarios(true) }]
      : []),
    ...(puedeVender && esAuto && fila.estado === "vendido"
      ? [{ etiqueta: "Deshacer venta", hacer: () => deshacer.mutate() }]
      : []),
    ...(puedeVender && !esAuto
      ? [{ etiqueta: "Deshacer la última venta", hacer: () => deshacer.mutate() }]
      : []),
    ...(puede("articulos.crear") ? [{ etiqueta: "Duplicar", hacer: () => duplicar.mutate() }] : []),
    ...(puede("articulos.eliminar")
      ? [{ etiqueta: "Eliminar", hacer: () => setEliminando(true) }]
      : []),
  ];

  const venta = puedeVender && aLaVenta && (esAuto || stock > 0);
  const editar = puede("articulos.editar");
  if (!venta && !editar && opciones.length === 0) return null;

  async function compartir() {
    const resultado = await compartirEnlace(fila.titulo, window.location.origin + fila.ruta);
    if (resultado === "copiado") avisar("Enlace copiado.");
    if (resultado === "error") avisar("No se pudo copiar el enlace.", { tipo: "error" });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {venta ? (
        <button
          type="button"
          disabled={vender.isPending}
          onClick={() => vender.mutate(1)}
          className={BOTON_PRIMARIO}
        >
          {esAuto ? "Vendido" : "Vendí 1"}
        </button>
      ) : null}
      {editar ? (
        <Link href={rutaPanel(`articulos/${fila.id}`)} className={BOTON_SECUNDARIO}>
          Editar
        </Link>
      ) : null}
      <button type="button" onClick={compartir} className={BOTON_SECUNDARIO}>
        Compartir
      </button>
      {opciones.length ? (
        <div
          className="relative"
          onKeyDown={(e) => e.key === "Escape" && setMenu(false)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMenu(false);
          }}
        >
          <button
            type="button"
            aria-expanded={menu}
            aria-controls={idMenu}
            aria-label="Más acciones"
            onClick={() => setMenu((m) => !m)}
            className={`${BOTON_SECUNDARIO} w-11 px-0`}
          >
            <span aria-hidden="true">⋯</span>
          </button>
          {menu ? (
            <ul
              id={idMenu}
              className="bg-tarjeta border-borde absolute right-0 bottom-full z-20 mb-2 flex w-56 flex-col gap-0.5 rounded-xl border p-1 shadow-lg lg:top-full lg:bottom-auto lg:mt-2 lg:mb-0"
            >
              {opciones.map((o) => (
                <li key={o.etiqueta}>
                  <button
                    type="button"
                    className={`${OPCION} ${o.etiqueta === "Eliminar" ? "text-rojo-oscuro" : ""}`}
                    onClick={() => {
                      setMenu(false);
                      o.hacer();
                    }}
                  >
                    {o.etiqueta}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Dialogo
        abierto={vendiendoVarios}
        titulo={`¿Cuántos vendiste de «${fila.titulo}»?`}
        textoConfirmar="Registrar venta"
        ocupado={vender.isPending}
        alConfirmar={() => vender.mutate(Number(cantidad))}
        alCerrar={() => setVendiendoVarios(false)}
      >
        <Campo id={`cantidad-${fila.id}`} etiqueta="Cantidad" ayuda={`Quedan ${stock}.`}>
          <input
            id={`cantidad-${fila.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={stock}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className={CAMPO}
          />
        </Campo>
      </Dialogo>
      <Dialogo
        abierto={eliminando}
        titulo={`¿Eliminar «${fila.titulo}»?`}
        textoConfirmar="Eliminar"
        peligroso
        ocupado={eliminar.isPending}
        alConfirmar={() => eliminar.mutate()}
        alCerrar={() => setEliminando(false)}
      >
        Se borra junto con sus fotos y no se puede deshacer. Si tiene ventas, ocultalo en su lugar.
      </Dialogo>
    </div>
  );
}
