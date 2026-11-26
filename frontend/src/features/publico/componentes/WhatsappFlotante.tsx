"use client";

import { usePathname } from "next/navigation";
import type { SyntheticEvent } from "react";

import { enlaceWhatsapp, enlaceWhatsappGeneral } from "@/shared/lib/whatsapp";

import { IconoWhatsapp } from "./BotonWhatsapp";

// Ficha de un auto o repuesto: /autos/<slug>-<id> o /repuestos/<slug>-<id>.
const FICHA = /^\/(autos|repuestos)\/[^/]+$/;

/**
 * Botón circular fijo de WhatsApp en la web pública (#115). En la ficha lleva el título y el
 * enlace del artículo, y en el celular no se muestra: ahí ya está la barra fija con «Consultar».
 */
export function WhatsappFlotante({ numero }: { numero: string }) {
  const pathname = usePathname();
  const enFicha = FICHA.test(pathname);
  // El título se lee del <h1> de la ficha al usar el enlace, cuando la ficha ya está pintada.
  const completar = (e: SyntheticEvent<HTMLAnchorElement>) => {
    const titulo = enFicha ? document.querySelector("h1")?.textContent?.trim() : undefined;
    // Fuera de la ficha vuelve al general: al navegar sin recargar, React no reescribe el href.
    e.currentTarget.href = titulo
      ? enlaceWhatsapp(numero, titulo, window.location.origin + pathname)
      : enlaceWhatsappGeneral(numero);
  };

  return (
    <a
      href={enlaceWhatsappGeneral(numero)}
      data-origen-whatsapp="flotante"
      onClick={completar}
      onFocus={completar}
      onMouseEnter={completar}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      title="Escribinos por WhatsApp"
      className={`bg-whatsapp text-carbon fixed right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex size-13 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus-visible:scale-105 motion-reduce:transition-none md:right-[max(1.5rem,env(safe-area-inset-right))] md:bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:size-14 ${
        enFicha ? "max-lg:hidden" : ""
      }`}
    >
      <IconoWhatsapp tamano={28} />
    </a>
  );
}
