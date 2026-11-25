import type { ReactNode } from "react";

/** Tarjeta centrada con el logo para el login y las pantallas de contraseña. */
export function MarcoAcceso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="bg-tarjeta border-borde flex w-full max-w-md flex-col gap-6 rounded-3xl border p-6 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, sin optimizar */}
        <img
          src="/marca/logo-completo.svg"
          alt="Garaje Ruta"
          width={180}
          height={48}
          className="oscuro:hidden h-12 w-auto self-start"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, sin optimizar */}
        <img
          src="/marca/logo-completo-oscuro.svg"
          alt=""
          width={180}
          height={48}
          className="oscuro:block hidden h-12 w-auto self-start"
        />
        <h1 className="titulo text-3xl">{titulo}</h1>
        {children}
      </div>
    </main>
  );
}
