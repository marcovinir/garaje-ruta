"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

import { paginaDeEvento, registrarEvento } from "@/shared/lib/eventos";

import { filtrosDesdeUrl, NO_SON_FILTROS } from "./filtrosDesdeUrl";

type Props = Omit<ComponentProps<"form">, "method" | "action" | "onSubmit"> & {
  action: "/autos" | "/repuestos";
  seccionEvento: "filtros" | "compatibilidad";
};

/**
 * Formulario GET que sin JavaScript envía normal; con JavaScript navega sin recargar y sin los
 * campos vacíos, para que la URL compartida quede limpia (`?marca=3`, no `?marca=3&modelo=&…`).
 */
export function FormularioGet({ action, seccionEvento, ...props }: Props) {
  const router = useRouter();
  return (
    <form
      {...props}
      method="get"
      action={action}
      onSubmit={(evento) => {
        evento.preventDefault();
        const params = new URLSearchParams();
        for (const [clave, valor] of new FormData(evento.currentTarget)) {
          if (typeof valor === "string" && valor.trim()) params.append(clave, valor.trim());
        }
        const { pagina } = paginaDeEvento(window.location.pathname);
        const filtros = filtrosDesdeUrl(
          Object.fromEntries(params),
          action === "/autos" ? "auto" : "repuesto",
        );
        registrarEvento("filter_applied", {
          contexto: {
            pagina,
            seccion: seccionEvento,
            filtros: Object.keys(filtros).filter((clave) => !NO_SON_FILTROS.has(clave)),
          },
        });
        const query = params.toString();
        router.push(`${action}${query ? `?${query}` : ""}`);
      }}
    />
  );
}
