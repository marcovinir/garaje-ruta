"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useYo } from "../auth/api";
import { rutaPanel } from "../rutaPanel";
import { BOTON_SECUNDARIO } from "../ui/estilos";
import { MarcoPanel } from "./MarcoPanel";

/** Las páginas protegidas: sin sesión, al login con `siguiente` para volver a la misma pantalla. */
export function GuardiaSesion({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const busqueda = useSearchParams().toString();
  const { data: yo, isPending, isError, refetch } = useYo();

  useEffect(() => {
    if (yo === null) {
      const aqui = busqueda ? `${pathname}?${busqueda}` : pathname;
      router.replace(`${rutaPanel("login")}?siguiente=${encodeURIComponent(aqui)}`);
    }
  }, [yo, pathname, busqueda, router]);

  if (isError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert">No pudimos conectar con el garaje. Revisá tu conexión.</p>
        <button type="button" className={BOTON_SECUNDARIO} onClick={() => refetch()}>
          Reintentar
        </button>
      </main>
    );
  }
  if (isPending || !yo) {
    return <div aria-busy="true" className="min-h-dvh" />;
  }
  return <MarcoPanel yo={yo}>{children}</MarcoPanel>;
}
