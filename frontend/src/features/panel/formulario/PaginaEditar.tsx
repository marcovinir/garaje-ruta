"use client";

import Link from "next/link";
import { useState } from "react";

import { EtiquetaEstado } from "@/features/publico/componentes/EtiquetaEstado";
import { ApiError } from "@/shared/api/navegador";

import { useSesion } from "../auth/useSesion";
import { rutaPanel } from "../rutaPanel";
import { DialogoMarketplace } from "../articulos/DialogoMarketplace";
import { RequierePermiso } from "../estructura/RequierePermiso";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_SECUNDARIO, TARJETA } from "../ui/estilos";
import { useCatalogos, useDetalle } from "./api";
import { FormularioArticulo } from "./FormularioArticulo";

function Contenido({ id }: { id: number }) {
  const { puede } = useSesion();
  const [marketplace, setMarketplace] = useState(false);
  const detalle = useDetalle(id);
  const catalogos = useCatalogos();

  if (detalle.error instanceof ApiError && detalle.error.status === 404) {
    return (
      <div className={`${TARJETA} p-5`}>
        <EncabezadoPagina titulo="Ese artículo no existe" descripcion="Quizá se eliminó." />
      </div>
    );
  }
  if (detalle.isError || catalogos.isError) {
    return (
      <div className={`${TARJETA} flex flex-col items-start gap-3 p-5`}>
        <p role="alert">No pudimos cargar el artículo.</p>
        <button
          type="button"
          className={BOTON_SECUNDARIO}
          onClick={() => {
            detalle.refetch();
            catalogos.refetch();
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }
  if (!detalle.data || !catalogos.data) {
    return <div aria-busy="true" className="bg-campo h-96 animate-pulse rounded-2xl" />;
  }
  const d = detalle.data;
  return (
    <>
      <EncabezadoPagina
        titulo={`Editar ${d.tipo === "auto" ? "auto" : "repuesto"}`}
        descripcion={d.titulo}
        acciones={
          <>
            <EtiquetaEstado estado={d.estado} />
            <button type="button" className={BOTON_SECUNDARIO} onClick={() => setMarketplace(true)}>
              Texto para Marketplace
            </button>
            {puede("historial.ver") && (
              <Link href={rutaPanel("historial?articulo=" + d.id)} className={BOTON_SECUNDARIO}>
                Ver historial
              </Link>
            )}
          </>
        }
      />
      <DialogoMarketplace
        id={marketplace ? d.id : null}
        titulo={d.titulo}
        alCerrar={() => setMarketplace(false)}
      />
      <FormularioArticulo key={d.id} tipo={d.tipo} catalogos={catalogos.data} detalle={d} />
    </>
  );
}

export function PaginaEditar({ id }: { id: number }) {
  return (
    <RequierePermiso codigo="articulos.editar">
      <div className="flex flex-col gap-5">
        <Contenido id={id} />
      </div>
    </RequierePermiso>
  );
}
