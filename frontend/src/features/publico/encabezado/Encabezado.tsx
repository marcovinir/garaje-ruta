"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";

import { Buscador } from "./Buscador";
import { Icono, TRAZOS } from "./iconos";
import { Navegacion, NavegacionBase } from "./Navegacion";
import { useDesplazado } from "./useDesplazado";

function Logo({ className }: { className: string }) {
  return (
    <Link
      href="/"
      aria-label="Garaje Ruta, inicio"
      className="inline-flex min-h-11 shrink-0 items-center"
    >
      <Image
        src="/marca/logo-completo.svg"
        alt=""
        width={144}
        height={45}
        loading="lazy"
        unoptimized
        className={`w-auto transition-[height] motion-reduce:transition-none ${className}`}
      />
    </Link>
  );
}

function Nav(props: { variante: "principal" | "menu" | "accesos"; alNavegar?: () => void }) {
  return (
    <Suspense fallback={<NavegacionBase {...props} activa={null} />}>
      <Navegacion {...props} />
    </Suspense>
  );
}

/**
 * Encabezado público (#115). Escritorio: logo y buscador, y debajo la navegación centrada.
 * Celular: menú y logo centrado, buscador y accesos a Autos, Repuestos y Ofertas. Al bajar se
 * compacta (en el celular se esconden los accesos). Línea roja inferior.
 */
export function Encabezado() {
  const compacto = useDesplazado();
  // Sin usePathname aquí: con Cache Components rompería la parte estática de la página. El menú
  // se cierra al tocar uno de sus enlaces o con Esc.
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);
  const botonMenu = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      // Si el buscador ya usó el Esc para cerrar sus sugerencias, el menú queda.
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const focoAdentro = botonMenu.current?.closest("header")?.contains(document.activeElement);
      setAbierto(false);
      if (focoAdentro) botonMenu.current?.focus();
    };
    // Atrás o Adelante del navegador también cierran el menú.
    const alVolver = () => setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    window.addEventListener("popstate", alVolver);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      window.removeEventListener("popstate", alVolver);
    };
  }, [abierto]);

  return (
    <header
      data-compacto={compacto}
      data-menu-abierto={abierto}
      // Cualquier enlace del encabezado (menú, accesos, logo) navega: el menú se cierra.
      onClickCapture={(e) => {
        if ((e.target as Element).closest("a")) setAbierto(false);
      }}
      className="bg-tarjeta border-rojo group sticky top-0 z-30 border-b-2 shadow-sm [--alto-menu:max(2.75rem,min(35dvh,100dvh-12rem))] [--sugerencias-top:7.75rem] max-lg:data-[menu-abierto=true]:[--sugerencias-top:calc(7.75rem+var(--alto-menu))] lg:[--sugerencias-top:5rem]"
    >
      {/* Escritorio */}
      <div className="hidden lg:block">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-3 transition-[padding] group-data-[compacto=true]:py-1.5 motion-reduce:transition-none">
          <Logo className="h-11 group-data-[compacto=true]:h-8" />
          <Buscador id="buscar-escritorio" />
        </div>
        <div className="border-borde border-t">
          <div className="mx-auto max-w-6xl px-6">
            <Nav variante="principal" />
          </div>
        </div>
      </div>

      {/* Celular y tablet */}
      <div className="flex flex-col gap-2 px-4 py-2 lg:hidden">
        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <button
            ref={botonMenu}
            type="button"
            onClick={() => setAbierto(!abierto)}
            aria-expanded={abierto}
            aria-controls={abierto ? "menu-publico" : undefined}
            aria-label={abierto ? "Cerrar el menú" : "Abrir el menú"}
            className="hover:bg-campo flex size-11 items-center justify-center rounded-xl"
          >
            <Icono trazo={abierto ? TRAZOS.cerrar : TRAZOS.menu} className="size-6" />
          </button>
          <div className="flex justify-center">
            <Logo className="h-9 group-data-[compacto=true]:h-7" />
          </div>
        </div>
        {abierto ? (
          <div
            id="menu-publico"
            className="border-borde max-h-(--alto-menu) overflow-y-auto overscroll-contain border-t"
          >
            <Nav variante="menu" alNavegar={cerrar} />
          </div>
        ) : null}
        <Buscador id="buscar-celular" alElegir={cerrar} />
        <div className="group-data-[compacto=true]:hidden [@media(max-height:320px)]:group-data-[menu-abierto=true]:hidden">
          <Nav variante="accesos" />
        </div>
      </div>
    </header>
  );
}
