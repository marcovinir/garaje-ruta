import Image from "next/image";
import Link from "next/link";

import type { Configuracion } from "@/shared/api/tipos";
import { enlaceWhatsappGeneral } from "@/shared/lib/whatsapp";

import { IconoWhatsapp } from "./BotonWhatsapp";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Agrupa días seguidos con el mismo horario: «Lunes a viernes · 08:00 a 17:00». */
export function resumirHorarios(horarios: Configuracion["horarios"]): string[] {
  const grupos: { desde: number; hasta: number; franja: string }[] = [];
  for (const h of [...horarios].sort((a, b) => a.dia_semana - b.dia_semana)) {
    const franja = `${h.apertura} a ${h.cierre}`;
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.franja === franja && ultimo.hasta === h.dia_semana - 1) {
      ultimo.hasta = h.dia_semana;
    } else {
      grupos.push({ desde: h.dia_semana, hasta: h.dia_semana, franja });
    }
  }
  return grupos.map((g) => {
    const dias =
      g.desde === g.hasta ? DIAS[g.desde] : `${DIAS[g.desde]} a ${DIAS[g.hasta].toLowerCase()}`;
    return `${dias} · ${g.franja}`;
  });
}

export function PieDePagina({ configuracion }: { configuracion: Configuracion | null }) {
  return (
    <footer id="contacto" className="bg-tarjeta border-borde mt-auto scroll-mt-36 border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Image
            src="/marca/logo-completo.svg"
            alt="Garaje Ruta"
            width={160}
            height={50}
            unoptimized
            className="h-11 w-auto self-start"
          />
          <p className="text-tinta-suave text-sm">
            {configuracion?.direccion ?? "Heredia, Costa Rica"} · Negocio ficticio de portafolio.
          </p>
          {configuracion ? (
            <a
              href={enlaceWhatsappGeneral(configuracion.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp-fuerte hover:bg-whatsapp-fuerte-hover inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-4 font-semibold text-white"
            >
              <IconoWhatsapp />
              Escribinos por WhatsApp
            </a>
          ) : null}
          <Link
            href="/contacto"
            className="text-rojo-oscuro self-start text-sm font-semibold underline underline-offset-4"
          >
            Contacto y confianza
          </Link>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <h2 className="titulo text-lg">Horario</h2>
          {configuracion ? (
            resumirHorarios(configuracion.horarios).map((linea) => (
              <p key={linea} className="text-tinta-suave">
                {linea}
              </p>
            ))
          ) : (
            <p className="text-tinta-suave">Consultá por WhatsApp.</p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <h2 className="titulo text-lg">Ubicación</h2>
          {configuracion?.mapa_url ? (
            <a href={configuracion.mapa_url} target="_blank" rel="noopener noreferrer">
              Ver en el mapa
            </a>
          ) : (
            <p className="text-tinta-suave">{configuracion?.direccion ?? "Heredia, Costa Rica"}</p>
          )}
          <p className="text-tinta-suave text-xs">
            Tipo de cambio:{" "}
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Rates By Exchange Rate API
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
