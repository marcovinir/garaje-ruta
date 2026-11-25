"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { Buscador } from "./Buscador";
import { Icono, TRAZOS } from "./iconos";
import { Navegacion, NavegacionBase } from "./Navegacion";
import { useDesplazado } from "./useDesplazado";

function Logo({ className }: { className: string }) {
  return (
    <Link href="/" aria-label="Garaje Ruta, inicio" className="shrink-0">
      <Image
        src="/marca/logo-completo.svg"
        alt=""
        width={144}
        height={45}
        priority
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

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  return (
    <header
      data-compacto={compacto}
      className="bg-tarjeta border-rojo group sticky top-0 z-30 border-b-2 shadow-sm"
    >
      {/* Escritorio */}
      <div className="hidden lg:block">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-3 transition-[padding] group-data-[compacto=true]:py-1.5 motion-reduce:transition-none">
          <Logo className="h-11 group-data-[compacto=true]:h-8" />
          <Buscador id="buscar-escritorio" />
        </div>
        <div className="border-borde border-t">
          <div className="mx-auto max-w-6xl px-6 group-data-[compacto=true]:[&_a]:min-h-9">
            <Nav variante="principal" />
          </div>
        </div>
      </div>

      {/* Celular y tablet */}
      <div className="flex flex-col gap-2 px-4 py-2 lg:hidden">
        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <button
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
          <div id="menu-publico" className="border-borde border-t">
            <Nav variante="menu" alNavegar={cerrar} />
          </div>
        ) : null}
        <Buscador id="buscar-celular" />
        <div className="group-data-[compacto=true]:hidden">
          <Nav variante="accesos" />
        </div>
      </div>
    </header>
  );
}
