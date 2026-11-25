"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { type Yo, useLogout } from "../auth/api";
import { rutaPanel } from "../rutaPanel";
import { InterruptorTema } from "../ui/InterruptorTema";
import { ICONO_MAS, ICONO_NUEVO, ICONO_SALIR, SECCIONES, type Seccion } from "./secciones";

function Icono({ trazo }: { trazo: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={trazo} />
    </svg>
  );
}

function esActual(pathname: string, s: Seccion): boolean {
  const base = rutaPanel(s.subruta);
  if (pathname === rutaPanel("articulos/nuevo")) return false;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Estructura del panel (§11): celular = barra superior y navegación inferior fija (Artículos,
 * Nuevo, Más); tablet = menú lateral plegable; escritorio = menú lateral fijo.
 */
export function MarcoPanel({ yo, children }: { yo: Yo; children: ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const [plegado, setPlegado] = useState(false);
  const [mas, setMas] = useState(false);
  const secciones = SECCIONES.filter((s) => yo.permisos.includes(s.permiso));
  const puedeCrear = yo.permisos.includes("articulos.crear");
  const nuevoActual = pathname === rutaPanel("articulos/nuevo");

  const salir = (
    <button
      type="button"
      onClick={() => logout.mutate()}
      className="text-tinta-suave hover:bg-campo hover:text-tinta flex min-h-11 w-full items-center gap-3 rounded-xl px-3 font-semibold"
    >
      <Icono trazo={ICONO_SALIR} />
      <span className={plegado ? "md:sr-only lg:not-sr-only" : ""}>Salir</span>
    </button>
  );

  return (
    <div className="min-h-dvh md:flex">
      {/* Menú lateral: plegable en tablet, fijo en escritorio. */}
      <aside
        className={`bg-tarjeta border-borde sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 border-r p-3 md:flex ${
          plegado ? "w-20 lg:w-64" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-1 py-2">
          {/* Logo normal y, en modo oscuro, el de «GARAJE» en blanco. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG local */}
          <img
            src={plegado ? "/marca/logo-simbolo.svg" : "/marca/logo-completo.svg"}
            alt="Garaje Ruta"
            className="oscuro:hidden h-9 w-auto"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG local */}
          <img
            src={plegado ? "/marca/logo-simbolo-oscuro.svg" : "/marca/logo-completo-oscuro.svg"}
            alt=""
            className="oscuro:block hidden h-9 w-auto"
          />
          <button
            type="button"
            onClick={() => setPlegado((p) => !p)}
            aria-expanded={!plegado}
            aria-label={plegado ? "Expandir el menú" : "Plegar el menú"}
            className="hover:bg-campo hidden size-11 items-center justify-center rounded-xl md:inline-flex lg:hidden"
          >
            <Icono trazo={plegado ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
          </button>
        </div>
        <nav aria-label="Panel" className="flex flex-1 flex-col gap-1">
          {secciones.map((s) => {
            const actual = esActual(pathname, s);
            return (
              <Link
                key={s.subruta}
                href={rutaPanel(s.subruta)}
                aria-current={actual ? "page" : undefined}
                title={plegado ? s.etiqueta : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold ${
                  actual
                    ? "bg-carbon text-white"
                    : "text-tinta-suave hover:bg-campo hover:text-tinta"
                }`}
              >
                <Icono trazo={s.icono} />
                <span className={plegado ? "md:sr-only lg:not-sr-only" : ""}>{s.etiqueta}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-borde flex flex-col gap-1 border-t pt-3">
          <p
            className={`text-tinta-suave truncate px-3 text-sm ${plegado ? "md:hidden lg:block" : ""}`}
          >
            {yo.nombre} · {yo.rol}
          </p>
          <InterruptorTema claseTexto={plegado ? "md:sr-only lg:not-sr-only" : ""} />
          {salir}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior del celular. */}
        <header className="bg-tarjeta border-borde sticky top-0 z-20 flex items-center justify-between border-b px-4 py-2 md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG local */}
          <img
            src="/marca/logo-completo.svg"
            alt="Garaje Ruta"
            className="oscuro:hidden h-9 w-auto"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG local */}
          <img
            src="/marca/logo-completo-oscuro.svg"
            alt=""
            className="oscuro:block hidden h-9 w-auto"
          />
          <div className="flex items-center gap-1">
            <span className="text-tinta-suave text-sm">{yo.nombre}</span>
            <InterruptorTema compacto />
          </div>
        </header>
        <main
          id="contenido"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:px-6 md:pb-10"
        >
          {children}
        </main>
      </div>

      {/* Navegación inferior del celular. */}
      <nav
        aria-label="Navegación del celular"
        className="bg-tarjeta border-borde fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {mas ? (
          <ul id="menu-mas" className="border-borde flex flex-col gap-1 border-b p-2">
            {secciones
              .filter((s) => s.subruta !== "articulos")
              .map((s) => (
                <li key={s.subruta}>
                  <Link
                    href={rutaPanel(s.subruta)}
                    onClick={() => setMas(false)}
                    aria-current={esActual(pathname, s) ? "page" : undefined}
                    className="hover:bg-campo flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold"
                  >
                    <Icono trazo={s.icono} />
                    {s.etiqueta}
                  </Link>
                </li>
              ))}
            <li>{salir}</li>
          </ul>
        ) : null}
        <ul className="grid grid-cols-3">
          <li>
            <Link
              href={rutaPanel("articulos")}
              aria-current={esActual(pathname, SECCIONES[0]) ? "page" : undefined}
              className="aria-[current=page]:text-rojo-oscuro text-tinta-suave flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold"
            >
              <Icono trazo={SECCIONES[0].icono} />
              Artículos
            </Link>
          </li>
          <li>
            {puedeCrear ? (
              <Link
                href={rutaPanel("articulos/nuevo")}
                aria-current={nuevoActual ? "page" : undefined}
                className="aria-[current=page]:text-rojo-oscuro text-tinta-suave flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold"
              >
                <Icono trazo={ICONO_NUEVO} />
                Nuevo
              </Link>
            ) : null}
          </li>
          <li>
            <button
              type="button"
              aria-expanded={mas}
              aria-controls={mas ? "menu-mas" : undefined}
              onClick={() => setMas((m) => !m)}
              className="text-tinta-suave flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold"
            >
              <Icono trazo={ICONO_MAS} />
              Más
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
