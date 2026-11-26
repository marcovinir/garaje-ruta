"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Paginacion } from "@/features/publico/filtros/Paginacion";

import { useSesion } from "../auth/useSesion";
import { rutaPanel } from "../rutaPanel";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, TARJETA } from "../ui/estilos";
import { useEscritorio } from "../ui/useEscritorio";
import { useArticulos, useTipoCambio } from "./api";
import { BarraAcciones } from "./BarraAcciones";
import { DialogoMarketplace } from "./DialogoMarketplace";
import { filtrosPanelDesdeUrl } from "./filtros";
import { FiltrosPanel } from "./FiltrosPanel";
import { TablaPanel } from "./TablaPanel";
import { TarjetaPanel } from "./TarjetaPanel";

function AvisoTipoCambio() {
  const { data } = useTipoCambio();
  if (!data?.desactualizado) return null;
  return (
    <p className="bg-agotado text-agotado-tinta rounded-xl px-4 py-3 font-semibold">
      El tipo de cambio tiene más de 3 días: los precios en dólares pueden estar corridos.
    </p>
  );
}

export function PaginaArticulos() {
  const busqueda = useSearchParams();
  const texto = busqueda.toString();
  const filtros = useMemo(() => filtrosPanelDesdeUrl(new URLSearchParams(texto)), [texto]);
  const consulta = useArticulos(filtros);
  const escritorio = useEscritorio();
  const { puede } = useSesion();
  const puedeEditar = puede("articulos.editar");
  const base = rutaPanel("articulos");
  const hayFiltros = Object.keys(filtros).some((k) => k !== "page");
  const router = useRouter();
  // «Texto para Marketplace» desde el aviso de un artículo recién creado.
  const marketplace = /^[1-9]\d{0,15}$/.test(busqueda.get("marketplace") ?? "")
    ? Number(busqueda.get("marketplace"))
    : null;
  const cerrarMarketplace = () => {
    const resto = new URLSearchParams(texto);
    resto.delete("marketplace");
    router.replace(base + (resto.size ? "?" + resto.toString() : ""));
  };

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPagina
        titulo="Artículos"
        acciones={
          puede("articulos.crear") ? (
            <>
              <Link href={rutaPanel("articulos/nuevo?tipo=auto")} className={BOTON_PRIMARIO}>
                Nuevo auto
              </Link>
              <Link href={rutaPanel("articulos/nuevo?tipo=repuesto")} className={BOTON_SECUNDARIO}>
                Nuevo repuesto
              </Link>
            </>
          ) : null
        }
      />
      <AvisoTipoCambio />
      <FiltrosPanel filtros={filtros} />

      {consulta.isError && !consulta.data ? (
        <div className={`${TARJETA} flex flex-col items-start gap-3 p-5`}>
          <p role="alert">No pudimos cargar los artículos.</p>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => consulta.refetch()}>
            Reintentar
          </button>
        </div>
      ) : !consulta.data ? (
        <div aria-busy="true" className="bg-campo h-64 animate-pulse rounded-2xl" />
      ) : consulta.data.results.length === 0 ? (
        <div className={`${TARJETA} flex flex-col items-start gap-3 p-5`}>
          <p>{hayFiltros ? "No hay artículos con estos filtros." : "Todavía no hay artículos."}</p>
          {hayFiltros ? (
            <Link href={base} className={BOTON_SECUNDARIO}>
              Quitar los filtros
            </Link>
          ) : puede("articulos.crear") ? (
            <Link href={rutaPanel("articulos/nuevo?tipo=auto")} className={BOTON_PRIMARIO}>
              Crear el primero
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <p role="status" className="font-semibold">
            {consulta.data.count} {consulta.data.count === 1 ? "artículo" : "artículos"}
          </p>
          {escritorio ? (
            <TablaPanel
              filas={consulta.data.results}
              puedeEditar={puedeEditar}
              acciones={(fila) => <BarraAcciones fila={fila} compacta />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {consulta.data.results.map((fila) => (
                <TarjetaPanel
                  key={fila.id}
                  fila={fila}
                  puedeEditar={puedeEditar}
                  acciones={<BarraAcciones fila={fila} />}
                />
              ))}
            </div>
          )}
          <Paginacion
            base={base}
            filtros={filtros as Record<string, string>}
            total={consulta.data.count}
          />
        </>
      )}
      <DialogoMarketplace id={marketplace} alCerrar={cerrarMarketplace} />
    </div>
  );
}
