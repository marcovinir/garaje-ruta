"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ApiError, api } from "@/shared/api/navegador";

import { rutaPanel } from "../rutaPanel";

export type Rol = "admin" | "colaborador" | "demo";

export type Yo = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  rol: Rol;
  permisos: string[];
};

export const CLAVE_YO = ["yo"] as const;

/** El usuario de la sesión, o `null` si no hay sesión (Django responde 403). */
export function useYo() {
  return useQuery({
    queryKey: CLAVE_YO,
    queryFn: async () => {
      try {
        return await api<Yo>("/auth/yo/");
      } catch (e) {
        if (e instanceof ApiError && (e.status === 403 || e.status === 401)) return null;
        throw e;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { email: string; password: string }) =>
      api<Yo>("/auth/login/", { metodo: "POST", cuerpo: datos }),
    onSuccess: (yo) => qc.setQueryData(CLAVE_YO, yo),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api("/auth/logout/", { metodo: "POST" }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(CLAVE_YO, null);
      router.replace(rutaPanel("login"));
    },
  });
}

export type ModoContrasena = "activar" | "restablecer";

/** Activa la cuenta o restablece la contraseña con el enlace del correo. */
export function useEstablecerContrasena(modo: ModoContrasena) {
  return useMutation({
    mutationFn: (datos: { uid: string; token: string; password: string }) =>
      api(`/auth/${modo}/`, { metodo: "POST", cuerpo: datos }),
  });
}

/** Pide el enlace para restablecer; Django responde igual exista o no la cuenta. */
export function useRecuperar() {
  return useMutation({
    mutationFn: (datos: { email: string }) =>
      api("/auth/recuperar/", { metodo: "POST", cuerpo: datos }),
  });
}

export const DEMASIADOS_INTENTOS = "Demasiados intentos. Esperá un minuto y probá de nuevo.";

/** Texto para mostrar de un error de la API (el `detalle` de Django, salvo casos conocidos). */
export function mensajeDe(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 429 ? DEMASIADOS_INTENTOS : error.detalle;
  }
  return "Algo salió mal. Intentá de nuevo.";
}
