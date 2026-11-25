"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type AccionAviso,
  AvisosContexto,
  type OpcionesAviso,
  type TipoAviso,
} from "./contextoAvisos";

type Aviso = { id: number; texto: string; tipo: TipoAviso; accion?: AccionAviso };

const ESTILO: Record<TipoAviso, string> = {
  exito: "bg-carbon text-white",
  error: "bg-rojo-suave text-rojo-oscuro border border-rojo-oscuro",
};

/**
 * Avisos efímeros (toasts) con `aria-live`. Duran 5 s; con una acción («Deshacer») 8 s para dar
 * tiempo, y no se cierran mientras tienen el mouse encima o el foco (WCAG 2.2.1). En el celular
 * quedan sobre la navegación inferior.
 */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguiente = useRef(1);

  const quitar = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);
  const avisar = useCallback((texto: string, { tipo = "exito", accion }: OpcionesAviso = {}) => {
    const id = siguiente.current++;
    setAvisos((a) => [...a, { id, texto, tipo, accion }]);
  }, []);
  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <AvisosContexto.Provider value={valor}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
      >
        {avisos.map((a) => (
          <ItemAviso key={a.id} aviso={a} alCerrar={() => quitar(a.id)} />
        ))}
      </div>
    </AvisosContexto.Provider>
  );
}

function ItemAviso({ aviso, alCerrar }: { aviso: Aviso; alCerrar: () => void }) {
  const [encima, setEncima] = useState(false);
  const [conFoco, setConFoco] = useState(false);
  const pausado = encima || conFoco;
  const cerrar = useRef(alCerrar);
  useEffect(() => {
    cerrar.current = alCerrar;
  });

  // Al pausar se corta el reloj; al soltar arranca de nuevo con la duración completa.
  useEffect(() => {
    if (pausado) return;
    const reloj = window.setTimeout(() => cerrar.current(), aviso.accion ? 8000 : 5000);
    return () => window.clearTimeout(reloj);
  }, [pausado, aviso.accion]);

  return (
    <div
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onFocus={() => setConFoco(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setConFoco(false);
      }}
      className={`aparece pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${ESTILO[aviso.tipo]}`}
    >
      <span className="flex-1">{aviso.texto}</span>
      {aviso.accion ? (
        <button
          type="button"
          onClick={() => {
            aviso.accion?.alHacer();
            alCerrar();
          }}
          className="min-h-11 rounded-lg px-3 font-bold underline underline-offset-4"
        >
          {aviso.accion.etiqueta}
        </button>
      ) : null}
    </div>
  );
}
