"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"form">, "method" | "action" | "onSubmit"> & { action: string };

/**
 * Formulario GET que sin JavaScript envía normal; con JavaScript navega sin recargar y sin los
 * campos vacíos, para que la URL compartida quede limpia (`?marca=3`, no `?marca=3&modelo=&…`).
 */
export function FormularioGet({ action, ...props }: Props) {
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
        const query = params.toString();
        router.push(`${action}${query ? `?${query}` : ""}`);
      }}
    />
  );
}
