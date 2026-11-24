import { createContext, useContext } from "react";

export type TipoAviso = "exito" | "error";
export type AccionAviso = { etiqueta: string; alHacer: () => void };
export type OpcionesAviso = { tipo?: TipoAviso; accion?: AccionAviso };

export type ContextoAvisos = { avisar: (texto: string, opciones?: OpcionesAviso) => void };

export const AvisosContexto = createContext<ContextoAvisos>({ avisar: () => {} });

export const useAvisos = () => useContext(AvisosContexto);
