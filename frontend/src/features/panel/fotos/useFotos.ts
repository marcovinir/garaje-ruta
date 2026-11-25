"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FotoApi } from "@/shared/api/tipos";

import { mensajeDe } from "../auth/api";
import { ErrorFoto, comprimir } from "./comprimir";
import { ErrorFirma, type Firma, pedirFirma, subirFoto } from "./subir";

export const MAX_FOTOS = 15;
const EN_PARALELO = 3;
// Cloudinary acepta firmas de hasta 1 h: se renueva antes, con margen.
const VIGENCIA_FIRMA_S = 50 * 60;

export type EstadoFoto = "pendiente" | "subiendo" | "lista" | "error";

export type ItemFoto = {
  clave: string;
  estado: EstadoFoto;
  progreso: number;
  foto?: FotoApi;
  archivo?: File;
  vista?: string;
  error?: string;
};

export type DependenciasFotos = {
  comprimir: typeof comprimir;
  subir: typeof subirFoto;
  firmar: typeof pedirFirma;
};

const REALES: DependenciasFotos = { comprimir, subir: subirFoto, firmar: pedirFirma };

let contador = 0;
const nuevaClave = () => `foto-${++contador}`;

function vistaPrevia(archivo: File): string | undefined {
  return typeof URL.createObjectURL === "function" ? URL.createObjectURL(archivo) : undefined;
}

/**
 * Las fotos de un artículo mientras se editan (§8): cola con 3 subidas a la vez, tope de 15,
 * una firma por tanda (se pide otra si Cloudinary dice que venció) y el orden (la primera es la
 * principal). Una foto que falla queda en error sin frenar a las demás.
 */
export function useFotos(iniciales: FotoApi[], dependencias: Partial<DependenciasFotos> = {}) {
  // Fijas desde el primer render (en las pruebas se inyectan dobles).
  const [deps] = useState<DependenciasFotos>(() => ({ ...REALES, ...dependencias }));
  const [items, setItems] = useState<ItemFoto[]>(() =>
    iniciales.map((foto) => ({ clave: nuevaClave(), estado: "lista", progreso: 1, foto })),
  );
  const itemsRef = useRef(items);
  const activas = useRef(0);
  const firma = useRef<Promise<Firma> | null>(null);
  const cancelar = useRef(new Map<string, AbortController>());
  const [inicialesRef] = useState(() => JSON.stringify(iniciales));

  const actualizar = useCallback((cambio: (lista: ItemFoto[]) => ItemFoto[]) => {
    itemsRef.current = cambio(itemsRef.current);
    setItems(itemsRef.current);
  }, []);
  const cambiarItem = useCallback(
    (clave: string, datos: Partial<ItemFoto>) =>
      actualizar((lista) => lista.map((i) => (i.clave === clave ? { ...i, ...datos } : i))),
    [actualizar],
  );

  const obtenerFirma = useCallback(
    async (renovar = false): Promise<Firma> => {
      if (!renovar && firma.current) {
        const actual = await firma.current.catch(() => null);
        const edad = Date.now() / 1000 - (actual?.timestamp ?? 0);
        if (actual && edad < VIGENCIA_FIRMA_S) return actual;
      }
      const nueva = deps.firmar();
      firma.current = nueva;
      nueva.catch(() => {
        if (firma.current === nueva) firma.current = null;
      });
      return nueva;
    },
    [deps],
  );

  const bombear = useCallback(() => {
    while (activas.current < EN_PARALELO) {
      const siguiente = itemsRef.current.find((i) => i.estado === "pendiente");
      if (!siguiente?.archivo) return;
      activas.current++;
      cambiarItem(siguiente.clave, { estado: "subiendo", progreso: 0, error: undefined });
      const { clave, archivo } = siguiente;
      const control = new AbortController();
      cancelar.current.set(clave, control);
      void (async () => {
        try {
          const { comprimir: comprimirFoto, subir } = deps;
          const { blob } = await comprimirFoto(archivo);
          if (control.signal.aborted) return;
          const alProgreso = (progreso: number) => cambiarItem(clave, { progreso });
          let foto: FotoApi;
          try {
            const firmaActual = await obtenerFirma();
            if (control.signal.aborted) return;
            foto = await subir(blob, firmaActual, alProgreso, control.signal);
          } catch (error) {
            if (!(error instanceof ErrorFirma)) throw error;
            foto = await subir(blob, await obtenerFirma(true), alProgreso, control.signal);
          }
          cambiarItem(clave, { estado: "lista", progreso: 1, foto });
        } catch (error) {
          // Quitada mientras subía: ya no está en la lista.
          if (control.signal.aborted) return;
          cambiarItem(clave, {
            estado: "error",
            error: error instanceof ErrorFoto ? error.message : mensajeDe(error),
          });
        } finally {
          cancelar.current.delete(clave);
          activas.current--;
          // Se llama por la ref: al terminar una subida sigue con la cola.
          seguir.current();
        }
      })();
    }
  }, [cambiarItem, obtenerFirma, deps]);
  const seguir = useRef<() => void>(() => {});
  useEffect(() => {
    seguir.current = bombear;
  }, [bombear]);

  /** Agrega archivos a la cola; devuelve cuántos quedaron afuera por el tope. */
  const agregar = useCallback(
    (archivos: File[]): number => {
      const lugar = Math.max(0, MAX_FOTOS - itemsRef.current.length);
      const entran = archivos.slice(0, lugar);
      actualizar((lista) => [
        ...lista,
        ...entran.map((archivo) => ({
          clave: nuevaClave(),
          estado: "pendiente" as const,
          progreso: 0,
          archivo,
          vista: vistaPrevia(archivo),
        })),
      ]);
      bombear();
      return archivos.length - entran.length;
    },
    [actualizar, bombear],
  );

  const quitar = useCallback(
    (clave: string) =>
      actualizar((lista) => {
        const item = lista.find((i) => i.clave === clave);
        if (item?.vista) URL.revokeObjectURL?.(item.vista);
        // Si se estaba subiendo, se corta: así no queda una foto huérfana en Cloudinary.
        cancelar.current.get(clave)?.abort();
        return lista.filter((i) => i.clave !== clave);
      }),
    [actualizar],
  );

  const reintentar = useCallback(
    (clave: string) => {
      cambiarItem(clave, { estado: "pendiente", error: undefined, progreso: 0 });
      bombear();
    },
    [cambiarItem, bombear],
  );

  const mover = useCallback(
    (de: number, a: number) =>
      actualizar((lista) => {
        if (a < 0 || a >= lista.length || de === a) return lista;
        const copia = [...lista];
        const [item] = copia.splice(de, 1);
        copia.splice(a, 0, item);
        return copia;
      }),
    [actualizar],
  );

  // Al salir, liberar las vistas previas.
  useEffect(
    () => () => itemsRef.current.forEach((i) => i.vista && URL.revokeObjectURL?.(i.vista)),
    [],
  );

  const listas = () => items.filter((i) => i.estado === "lista" && i.foto).map((i) => i.foto!);
  return {
    items,
    agregar,
    quitar,
    reintentar,
    mover,
    hacerPrincipal: (indice: number) => mover(indice, 0),
    listas,
    ocupado: items.some((i) => i.estado === "pendiente" || i.estado === "subiendo"),
    conError: items.some((i) => i.estado === "error"),
    cambiado: () => JSON.stringify(listas()) !== inicialesRef,
  };
}

export type Fotos = ReturnType<typeof useFotos>;
