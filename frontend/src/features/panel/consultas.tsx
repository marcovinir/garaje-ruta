"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { ApiError, api } from "@/shared/api/navegador";

import { rutaPanel } from "./rutaPanel";

const esDeAcceso = (error: unknown): error is ApiError =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

/**
 * Django responde 403 (no 401) sin sesión, igual que sin permiso. Ante un 401/403 se vuelve a
 * pedir `auth/yo`: si también falla, la sesión terminó y se va al login con `siguiente`.
 */
export function crearCliente(irA: (ruta: string) => void): QueryClient {
  let revisando = false;
  async function alFallar(error: unknown) {
    if (!esDeAcceso(error) || revisando) return;
    const login = rutaPanel("login");
    if (window.location.pathname.startsWith(login)) return;
    revisando = true;
    try {
      await api("/auth/yo/");
    } catch (otro) {
      if (esDeAcceso(otro)) {
        cliente.clear();
        const aqui = window.location.pathname + window.location.search;
        irA(`${login}?motivo=sesion&siguiente=${encodeURIComponent(aqui)}`);
      }
    } finally {
      revisando = false;
    }
  }
  const cliente = new QueryClient({
    queryCache: new QueryCache({ onError: alFallar }),
    mutationCache: new MutationCache({ onError: alFallar }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // Un 4xx no mejora reintentando; un fallo de red o un 5xx sí, una vez.
        retry: (intentos, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && intentos < 1,
      },
    },
  });
  return cliente;
}

export function ProveedorConsultas({
  irA,
  children,
}: {
  irA: (ruta: string) => void;
  children: ReactNode;
}) {
  const [cliente] = useState(() => crearCliente(irA));
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}

export function ProveedorPanel({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <ProveedorConsultas irA={(ruta) => router.replace(ruta)}>{children}</ProveedorConsultas>;
}
