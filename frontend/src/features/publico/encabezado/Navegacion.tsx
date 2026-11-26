"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Icono, TRAZOS } from "./iconos";

type Clave = "inicio" | "autos" | "repuestos" | "ofertas" | "contacto";
type Variante = "principal" | "menu" | "accesos";

export const ENLACES: { clave: Clave; href: string; texto: string }[] = [
  { clave: "inicio", href: "/", texto: "Inicio" },
  { clave: "autos", href: "/autos", texto: "Autos" },
  { clave: "repuestos", href: "/repuestos", texto: "Repuestos" },
  { clave: "ofertas", href: "/autos?ofertas=1", texto: "Ofertas" },
  { clave: "contacto", href: "/contacto", texto: "Contacto" },
];

const ACCESOS: Clave[] = ["autos", "repuestos", "ofertas"];

const NOMBRE: Record<Variante, string> = {
  principal: "Principal",
  menu: "Menú",
  accesos: "Accesos rápidos",
};

const CLASES: Record<Variante, string> = {
  principal:
    "relative flex min-h-11 items-center gap-1.5 px-4 font-semibold after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:rounded-full hover:after:bg-borde aria-[current=page]:after:bg-rojo",
  menu: "hover:bg-campo aria-[current=page]:bg-campo flex min-h-12 items-center gap-3 rounded-lg px-3 font-semibold",
  accesos:
    "border-borde aria-[current=page]:border-rojo flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-semibold",
};

export function seccionActual(pathname: string, ofertas: boolean): Clave | null {
  if (pathname === "/") return "inicio";
  if (pathname === "/autos" && ofertas) return "ofertas";
  if (pathname === "/autos" || pathname.startsWith("/autos/")) return "autos";
  if (pathname === "/repuestos" || pathname.startsWith("/repuestos/")) return "repuestos";
  if (pathname === "/contacto") return "contacto";
  return null;
}

/** Sin hooks: también sirve de respaldo mientras se leen los parámetros de la URL. */
export function NavegacionBase({
  variante,
  activa,
  alNavegar,
}: {
  variante: Variante;
  activa: Clave | null;
  alNavegar?: () => void;
}) {
  const enlaces =
    variante === "accesos" ? ENLACES.filter((e) => ACCESOS.includes(e.clave)) : ENLACES;
  // En la fila principal, Ofertas lleva su ícono; en el menú y los accesos, todos.
  const conIcono = (clave: Clave) => variante !== "principal" || clave === "ofertas";
  return (
    <nav
      aria-label={NOMBRE[variante]}
      className={
        variante === "principal"
          ? "flex items-center justify-center gap-1"
          : variante === "menu"
            ? "flex flex-col py-2"
            : "grid grid-cols-3 gap-2"
      }
    >
      {enlaces.map((e) => (
        <Link
          key={e.clave}
          href={e.href}
          onClick={alNavegar}
          aria-current={activa === e.clave ? "page" : undefined}
          className={`${CLASES[variante]} ${
            e.clave === "ofertas" ? "text-rojo-oscuro" : "hover:text-rojo-oscuro"
          }`}
        >
          {conIcono(e.clave) ? (
            <Icono trazo={TRAZOS[e.clave]} className={variante === "menu" ? "size-5" : "size-4"} />
          ) : null}
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}

/** Marca la página actual leyendo la ruta y ?ofertas=1 (va dentro de un Suspense). */
export function Navegacion(props: { variante: Variante; alNavegar?: () => void }) {
  const pathname = usePathname();
  const ofertas = useSearchParams().get("ofertas") === "1";
  return <NavegacionBase {...props} activa={seccionActual(pathname, ofertas)} />;
}
