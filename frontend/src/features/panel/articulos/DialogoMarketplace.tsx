"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "@/shared/api/navegador";
import { urlDescarga } from "@/shared/lib/cloudinary";

import { Dialogo } from "../ui/Dialogo";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "../ui/estilos";

export type TextoMarketplace = {
  campos: { etiqueta: string; valor: string }[];
  descripcion: string;
  fotos: string[];
};

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [estado, setEstado] = useState<"listo" | "copiado" | "error">("listo");
  return (
    <button
      type="button"
      className={BOTON_SECUNDARIO + " min-h-9 px-3 text-sm"}
      aria-label={estado === "copiado" ? undefined : etiqueta}
      onClick={async () => setEstado((await copiar(texto)) ? "copiado" : "error")}
    >
      <span aria-live="polite">
        {estado === "copiado" ? "Copiado" : estado === "error" ? "No se pudo copiar" : "Copiar"}
      </span>
    </button>
  );
}

function Contenido({ datos }: { datos: TextoMarketplace }) {
  return (
    <div className="text-tinta flex flex-col gap-5">
      <section aria-labelledby="mk-casillas" className="flex flex-col gap-2">
        <h3 id="mk-casillas" className="font-semibold">
          1. Casillas del formulario
        </h3>
        <dl className="border-borde divide-borde divide-y rounded-xl border text-sm">
          {datos.campos.map((c) => (
            <div key={c.etiqueta} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <dt className="text-tinta-suave text-xs">{c.etiqueta}</dt>
                <dd className="font-semibold break-words">{c.valor}</dd>
              </div>
              <BotonCopiar texto={c.valor} etiqueta={`Copiar ${c.etiqueta.toLowerCase()}`} />
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="mk-descripcion" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 id="mk-descripcion" className="font-semibold">
            2. Descripción
          </h3>
          <BotonCopiar texto={datos.descripcion} etiqueta="Copiar descripción" />
        </div>
        <pre className="bg-campo max-h-64 overflow-y-auto rounded-xl p-3 font-sans text-sm whitespace-pre-wrap">
          {datos.descripcion}
        </pre>
      </section>

      <section aria-labelledby="mk-fotos" className="flex flex-col gap-2">
        <h3 id="mk-fotos" className="font-semibold">
          3. Fotos
        </h3>
        {datos.fotos.length ? (
          <ul className="flex flex-wrap gap-2">
            {datos.fotos.map((id, i) => (
              <li key={id}>
                <a
                  href={urlDescarga(id, `foto-${i + 1}`)}
                  download
                  className={BOTON_SECUNDARIO + " min-h-9 px-3 text-sm"}
                >
                  Bajar foto {i + 1}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-tinta-suave text-sm">Este artículo todavía no tiene fotos.</p>
        )}
        <p className="text-tinta-suave text-sm">
          Marketplace pide subirlas desde el celular o la computadora.
        </p>
      </section>
    </div>
  );
}

/** Texto para copiar y pegar en Facebook Marketplace (no hay forma de publicar automáticamente). */
export function DialogoMarketplace({
  id,
  titulo,
  alCerrar,
}: {
  id: number | null;
  titulo?: string;
  alCerrar: () => void;
}) {
  const consulta = useQuery({
    queryKey: ["panel", "articulos", id, "marketplace"],
    queryFn: () => api<TextoMarketplace>(`/panel/articulos/${id}/marketplace/`),
    enabled: id !== null,
  });
  return (
    <Dialogo
      abierto={id !== null}
      titulo={titulo ? `Marketplace: ${titulo}` : "Texto para Marketplace"}
      alCerrar={alCerrar}
    >
      <div className="flex flex-col gap-4">
        {consulta.isError ? (
          <div className="flex flex-col items-start gap-3">
            <p role="alert">No pudimos armar el texto.</p>
            <button type="button" className={BOTON_SECUNDARIO} onClick={() => consulta.refetch()}>
              Reintentar
            </button>
          </div>
        ) : consulta.data ? (
          <Contenido datos={consulta.data} />
        ) : (
          <div role="status" aria-busy="true" className="bg-campo h-48 animate-pulse rounded-xl">
            <span className="sr-only">Armando el texto</span>
          </div>
        )}
        <div className="flex justify-end">
          <button type="button" autoFocus className={BOTON_PRIMARIO} onClick={alCerrar}>
            Listo
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
