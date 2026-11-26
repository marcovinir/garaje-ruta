"use client";

import { useEffect } from "react";

import { paginaDeEvento, registrarEvento } from "@/shared/lib/eventos";

/** Observa enlaces y el formulario existente sin cambiar su navegación ni su foco. */
export function RegistroEventosPublicos() {
  useEffect(() => {
    const alUsarEnlace = (evento: MouseEvent) => {
      if (evento.type === "auxclick" && evento.button !== 1) return;
      if (!(evento.target instanceof Element)) return;
      const enlace = evento.target.closest<HTMLAnchorElement>('a[href^="https://wa.me/"]');
      if (!enlace) return;

      const { pagina, articulo } = paginaDeEvento(window.location.pathname);
      const enPie = enlace.closest("footer") !== null;
      const seccion =
        enlace.dataset.origenWhatsapp === "flotante"
          ? "flotante"
          : enPie
            ? "pie"
            : articulo
              ? "ficha"
              : "contacto";
      const datos = {
        articulo: enPie ? undefined : articulo,
        contexto: { pagina, seccion },
      } as const;
      registrarEvento("whatsapp_click", datos);
      const accion = enlace.dataset.accionWhatsapp;
      if (accion === "visit_request" || accion === "compatibility_request") {
        registrarEvento(accion, datos);
      }
    };

    const alBuscar = (evento: SubmitEvent) => {
      const formulario = evento.target;
      if (!(formulario instanceof HTMLFormElement)) return;
      if (!formulario.matches('header form[role="search"][action="/buscar"]')) return;
      const campo = formulario.elements.namedItem("q");
      if (!(campo instanceof HTMLInputElement) || !campo.value.trim()) return;
      const { pagina } = paginaDeEvento(window.location.pathname);
      registrarEvento("search_submitted", { contexto: { pagina, seccion: "encabezado" } });
    };

    document.addEventListener("click", alUsarEnlace, true);
    document.addEventListener("auxclick", alUsarEnlace, true);
    document.addEventListener("submit", alBuscar, true);
    return () => {
      document.removeEventListener("click", alUsarEnlace, true);
      document.removeEventListener("auxclick", alUsarEnlace, true);
      document.removeEventListener("submit", alBuscar, true);
    };
  }, []);

  return null;
}
