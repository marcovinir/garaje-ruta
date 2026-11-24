"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RequierePermiso } from "../estructura/RequierePermiso";
import { rutaPanel } from "../rutaPanel";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_SECUNDARIO, TARJETA } from "../ui/estilos";
import { useCatalogos } from "./api";
import { FormularioArticulo } from "./FormularioArticulo";

function ElegirTipo() {
  const opcion = `${TARJETA} hover:border-rojo flex min-h-24 flex-col justify-center gap-1 p-5`;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Link href={rutaPanel("articulos/nuevo?tipo=auto")} className={opcion}>
        <span className="titulo text-2xl">Un auto</span>
        <span className="text-tinta-suave">Ficha técnica, papeles y equipamiento.</span>
      </Link>
      <Link href={rutaPanel("articulos/nuevo?tipo=repuesto")} className={opcion}>
        <span className="titulo text-2xl">Un repuesto</span>
        <span className="text-tinta-suave">Cantidad y con qué vehículos es compatible.</span>
      </Link>
    </div>
  );
}

function Contenido() {
  const tipo = useSearchParams().get("tipo");
  const catalogos = useCatalogos();
  if (tipo !== "auto" && tipo !== "repuesto") {
    return (
      <>
        <EncabezadoPagina titulo="¿Qué vas a publicar?" />
        <ElegirTipo />
      </>
    );
  }
  return (
    <>
      <EncabezadoPagina titulo={tipo === "auto" ? "Nuevo auto" : "Nuevo repuesto"} />
      {catalogos.data ? (
        <FormularioArticulo key={tipo} tipo={tipo} catalogos={catalogos.data} />
      ) : catalogos.isError ? (
        <div className={`${TARJETA} flex flex-col items-start gap-3 p-5`}>
          <p role="alert">No pudimos cargar las marcas y categorías.</p>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => catalogos.refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <div aria-busy="true" className="bg-campo h-96 animate-pulse rounded-2xl" />
      )}
    </>
  );
}

export function PaginaNuevo() {
  return (
    <RequierePermiso codigo="articulos.crear">
      <div className="flex flex-col gap-5">
        <Contenido />
      </div>
    </RequierePermiso>
  );
}
