"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ChangeEvent, useState } from "react";

import { urlFoto } from "@/shared/lib/cloudinary";

import { BOTON_SECUNDARIO } from "../ui/estilos";
import { SIN_CONFIGURAR } from "./subir";
import { type Fotos, type ItemFoto, MAX_FOTOS } from "./useFotos";

const MINI =
  "bg-tarjeta/95 hover:bg-campo inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-semibold";

function Miniatura({
  item,
  indice,
  total,
  fotos,
}: {
  item: ItemFoto;
  indice: number;
  total: number;
  fotos: Fotos;
}) {
  const n = indice + 1;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.clave,
  });
  const imagen = item.vista ?? (item.foto ? urlFoto(item.foto.public_id, { ancho: 320 }) : "");
  return (
    <li
      ref={setNodeRef}
      aria-label={indice === 0 ? `Foto ${n} (principal)` : `Foto ${n}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-borde bg-campo relative flex flex-col overflow-hidden rounded-xl border ${
        isDragging ? "z-10 shadow-lg" : ""
      }`}
    >
      <div className="relative aspect-[4/3]">
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local o Cloudinary
          <img src={imagen} alt="" className="size-full object-cover" />
        ) : null}
        {indice === 0 ? (
          <span className="bg-rojo absolute top-1.5 left-1.5 rounded-md px-2 py-0.5 text-xs font-bold text-white">
            Principal
          </span>
        ) : null}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastrar la foto ${n}`}
          className="bg-tarjeta/90 absolute top-1.5 right-1.5 inline-flex size-11 cursor-grab touch-none items-center justify-center rounded-lg"
        >
          <span aria-hidden="true">⠿</span>
        </button>
        {item.estado === "subiendo" || item.estado === "pendiente" ? (
          <div className="bg-carbon/70 absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2 text-xs text-white">
            {item.estado === "pendiente" ? "En cola" : "Subiendo…"}
            <progress
              value={item.progreso}
              max={1}
              aria-label={`Subiendo la foto ${n}`}
              className="h-1.5 w-full accent-white"
            />
          </div>
        ) : null}
      </div>
      {item.estado === "error" ? (
        <p role="alert" className="text-rojo-oscuro bg-rojo-suave p-2 text-xs font-semibold">
          {item.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1 p-1">
        {item.estado === "error" ? (
          <button
            type="button"
            className={MINI}
            aria-label={`Reintentar la foto ${n}`}
            onClick={() => fotos.reintentar(item.clave)}
          >
            Reintentar
          </button>
        ) : null}
        {indice > 0 && item.estado === "lista" ? (
          <button
            type="button"
            className={MINI}
            aria-label={`Hacer principal la foto ${n}`}
            onClick={() => fotos.hacerPrincipal(indice)}
          >
            Principal
          </button>
        ) : null}
        {indice > 0 ? (
          <button
            type="button"
            className={MINI}
            aria-label={`Mover la foto ${n} antes`}
            onClick={() => fotos.mover(indice, indice - 1)}
          >
            ←
          </button>
        ) : null}
        {indice < total - 1 ? (
          <button
            type="button"
            className={MINI}
            aria-label={`Mover la foto ${n} después`}
            onClick={() => fotos.mover(indice, indice + 1)}
          >
            →
          </button>
        ) : null}
        <button
          type="button"
          className={`${MINI} text-rojo-oscuro`}
          aria-label={`Quitar la foto ${n}`}
          onClick={() => fotos.quitar(item.clave)}
        >
          Quitar
        </button>
      </div>
    </li>
  );
}

/**
 * Fotos del artículo (§8): cámara o galería, miniaturas con progreso, la primera es la principal;
 * reordenar arrastrando (mouse, mantener pulsado en el celular, teclado) o con los botones ← →.
 */
export function EditorFotos({ fotos }: { fotos: Fotos }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const claves = fotos.items.map((i) => i.clave);
  const sinConfigurar = fotos.items.some((i) => i.error === SIN_CONFIGURAR);
  const lleno = fotos.items.length >= MAX_FOTOS;

  function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const afuera = fotos.agregar(Array.from(e.target.files ?? []));
    setAviso(
      afuera > 0
        ? `Máximo ${MAX_FOTOS} fotos: ${afuera} ${afuera === 1 ? "quedó afuera" : "quedaron afuera"}.`
        : null,
    );
    e.target.value = "";
  }

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    fotos.mover(claves.indexOf(String(active.id)), claves.indexOf(String(over.id)));
  }

  const boton = `${BOTON_SECUNDARIO} cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:outline-2`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className={boton}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={lleno}
            onChange={alElegir}
            className="sr-only"
          />
          Tomar foto
        </label>
        <label className={boton}>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={lleno}
            onChange={alElegir}
            className="sr-only"
          />
          Elegir de la galería
        </label>
        <span className="text-tinta-suave ml-auto text-sm">
          {fotos.items.length} de {MAX_FOTOS}
        </span>
      </div>
      {aviso ? (
        <p
          role="status"
          className="text-agotado-tinta bg-agotado rounded-lg px-3 py-2 text-sm font-semibold"
        >
          {aviso}
        </p>
      ) : null}
      {sinConfigurar ? (
        <p className="bg-agotado text-agotado-tinta rounded-lg px-3 py-2 text-sm font-semibold">
          {SIN_CONFIGURAR}
        </p>
      ) : null}
      {fotos.items.length ? (
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
          <SortableContext items={claves} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {fotos.items.map((item, i) => (
                <Miniatura
                  key={item.clave}
                  item={item}
                  indice={i}
                  total={fotos.items.length}
                  fotos={fotos}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-tinta-suave text-sm">
          Todavía no hay fotos. La primera que agregues será la principal.
        </p>
      )}
    </div>
  );
}
