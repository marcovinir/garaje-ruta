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

/** Lo que pregunta el diálogo antes de una acción que cambia la web o las ventas. */
type Confirmacion = { titulo: string; texto: string; boton: string; hacer: () => void };

const CONFIRMAR_ESTADO: Record<EstadoArticulo, (titulo: string) => Omit<Confirmacion, "hacer">> = {
  reservado: (t) => ({
    titulo: "¿Reservar?",
    texto: `«${t}» sigue en la web, marcado como reservado.`,
    boton: "Sí, reservar",
  }),
  oculto: (t) => ({
    titulo: "¿Ocultar?",
    texto: `«${t}» deja de verse en la web hasta que lo publiqués.`,
    boton: "Sí, ocultar",
  }),
  disponible: (t) => ({
    titulo: "¿Ponerlo a la venta?",
    texto: `«${t}» queda disponible en la web.`,
    boton: "Sí, ponerlo a la venta",
  }),
  vendido: (t) => ({
    titulo: "¿Marcar como vendido?",
    texto: `«${t}» sale de la web.`,
    boton: "Sí, marcar vendido",
  }),
};

/**
 * Acciones rápidas de una fila: vender (con «Deshacer» en el aviso), editar, compartir y el menú
 * «Más» con estados, duplicar y eliminar. Cada acción se muestra solo con su permiso (§9).
 */
export function BarraAcciones({
  fila,
  compacta = false,
}: {
  fila: FilaPanel;
  /** En la tabla de escritorio: una sola línea, «Compartir» pasa al menú. */
  compacta?: boolean;
}) {
  const { puede } = useSesion();
  const qc = useQueryClient();
  const router = useRouter();
  const { avisar } = useAvisos();
  const idMenu = useId();
  const [menu, setMenu] = useState(false);
  const [vendiendoVarios, setVendiendoVarios] = useState(false);
  const [cantidad, setCantidad] = useState("1");
  const [errorCantidad, setErrorCantidad] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  const alFallar = (error: unknown) => {
    avisar(mensajeDe(error), { tipo: "error" });
    qc.invalidateQueries({ queryKey: CLAVE_ARTICULOS });
  };

  const deshacer = useMutation({
    mutationFn: (ventaId?: number) => accionesApi.deshacerVenta(fila.id, ventaId),
    onSuccess: (nueva) => {
      reemplazarFila(qc, nueva);
      avisar("Venta deshecha.");
    },
    onError: alFallar,
  });
  const vender = useMutation({
    mutationFn: (n: number) => accionesApi.vender(fila.id, n),
    onSuccess: ({ articulo, venta_id }, n) => {
      reemplazarFila(qc, articulo);
      setVendiendoVarios(false);
      avisar(n > 1 ? `Vendidos ${n}: ${fila.titulo}` : `Vendido: ${fila.titulo}`, {
        accion: { etiqueta: "Deshacer", alHacer: () => deshacer.mutate(venta_id) },
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
    ...(compacta ? [{ etiqueta: "Compartir", hacer: () => void compartir() }] : []),
    ...cambios.map((c) => ({
      etiqueta: c.etiqueta,
      hacer: () =>
        setConfirmacion({
          ...CONFIRMAR_ESTADO[c.estado](fila.titulo),
          hacer: () => estado.mutate(c.estado),
        }),
    })),
    ...(puedeVender && !esAuto && aLaVenta && stock > 1
      ? [
          {
            etiqueta: "Vendí varios…",
            hacer: () => {
              setCantidad("1");
              setErrorCantidad(null);
              setVendiendoVarios(true);
            },
          },
        ]
      : []),
    ...(puedeVender && esAuto && fila.estado === "vendido"
      ? [
          {
            etiqueta: "Deshacer venta",
            hacer: () =>
              setConfirmacion({
                titulo: "¿Deshacer la venta?",
                texto: `«${fila.titulo}» vuelve a estar disponible en la web y se borra la venta.`,
                boton: "Sí, deshacer venta",
                hacer: () => deshacer.mutate(),
              }),
          },
        ]
      : []),
    ...(puedeVender && !esAuto
      ? [
          {
            etiqueta: "Deshacer la última venta",
            hacer: () =>
              setConfirmacion({
                titulo: "¿Deshacer la última venta?",
                texto: `Se borra la última venta de «${fila.titulo}» y lo vendido vuelve al stock.`,
                boton: "Sí, deshacer venta",
                hacer: () => deshacer.mutate(),
              }),
          },
        ]
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
    <div
      className={`flex items-center justify-end gap-2 ${compacta ? "flex-nowrap" : "flex-wrap"}`}
    >
      {venta ? (
        <button
          type="button"
          disabled={vender.isPending}
          onClick={() =>
            setConfirmacion(
              esAuto
                ? {
                    titulo: "¿Marcar como vendido?",
                    texto: `«${fila.titulo}» sale de la web y queda registrada la venta.`,
                    boton: "Sí, marcar vendido",
                    hacer: () => vender.mutate(1),
                  }
                : {
                    titulo: "¿Registrar la venta de 1?",
                    texto: `De «${fila.titulo}» ${stock - 1 === 1 ? "queda 1" : `quedan ${stock - 1}`}.`,
                    boton: "Sí, registrar venta",
                    hacer: () => vender.mutate(1),
                  },
            )
          }
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
      {compacta ? null : (
        <button type="button" onClick={compartir} className={BOTON_SECUNDARIO}>
          Compartir
        </button>
      )}
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
        abierto={confirmacion !== null}
        titulo={confirmacion?.titulo ?? ""}
        textoConfirmar={confirmacion?.boton}
        textoCancelar="No"
        alConfirmar={() => {
          confirmacion?.hacer();
          setConfirmacion(null);
        }}
        alCerrar={() => setConfirmacion(null)}
      >
        {confirmacion?.texto}
      </Dialogo>
      <Dialogo
        abierto={vendiendoVarios}
        titulo={`¿Cuántos vendiste de «${fila.titulo}»?`}
        textoConfirmar="Registrar venta"
        ocupado={vender.isPending}
        alConfirmar={() => {
          const n = Number(cantidad);
          if (!/^\d+$/.test(cantidad.trim()) || n < 1 || n > stock) {
            setErrorCantidad(`Entre 1 y ${stock}.`);
            return;
          }
          vender.mutate(n);
        }}
        alCerrar={() => setVendiendoVarios(false)}
      >
        <Campo
          id={`cantidad-${fila.id}`}
          etiqueta="Cantidad"
          ayuda={`Quedan ${stock}.`}
          error={errorCantidad ?? undefined}
        >
          <input
            id={`cantidad-${fila.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={stock}
            value={cantidad}
            aria-invalid={errorCantidad ? true : undefined}
            onChange={(e) => {
              setCantidad(e.target.value);
              setErrorCantidad(null);
            }}
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
