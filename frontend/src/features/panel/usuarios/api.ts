"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/api/navegador";
import type { Pagina } from "@/shared/api/tipos";

import type { Rol } from "../auth/api";

/** Espejo de `UsuarioPanelSerializer` (backend/apps/cuentas/serializers.py). */
export type UsuarioPanel = {
  id: number;
  email: string;
  nombre: string;
  apellidos: string;
  rol: Rol;
  is_active: boolean;
  activado: boolean;
  creado_en: string;
};

export const CLAVE_USUARIOS = ["panel", "usuarios"] as const;

export function useUsuarios() {
  return useQuery({
    queryKey: CLAVE_USUARIOS,
    queryFn: () => api<Pagina<UsuarioPanel>>("/panel/usuarios/", { query: { tamano: 100 } }),
  });
}

export const usuariosApi = {
  crear: (datos: { email: string; nombre: string; apellidos: string; rol: Rol }) =>
    api<UsuarioPanel>("/panel/usuarios/", { metodo: "POST", cuerpo: datos }),
  editar: (id: number, datos: { nombre: string; apellidos: string }) =>
    api<UsuarioPanel>(`/panel/usuarios/${id}/`, { metodo: "PATCH", cuerpo: datos }),
  desactivar: (id: number) =>
    api<UsuarioPanel>(`/panel/usuarios/${id}/desactivar/`, { metodo: "POST" }),
  reactivar: (id: number) =>
    api<UsuarioPanel>(`/panel/usuarios/${id}/reactivar/`, { metodo: "POST" }),
  reenviar: (id: number) =>
    api<UsuarioPanel>(`/panel/usuarios/${id}/reenviar-activacion/`, { metodo: "POST" }),
};

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administración",
  colaborador: "Colaborador",
  demo: "Demo (solo lectura)",
};

export function estadoUsuario(u: UsuarioPanel): "Activo" | "Pendiente de activar" | "Desactivado" {
  // Un invitado nace con is_active=False (Django lo activa al crear su contraseña): primero
  // importa si ya activó la cuenta.
  if (!u.activado) return "Pendiente de activar";
  return u.is_active ? "Activo" : "Desactivado";
}
