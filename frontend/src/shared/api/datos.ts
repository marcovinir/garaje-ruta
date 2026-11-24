import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { pedir } from "./servidor";
import type {
  Catalogos,
  Configuracion,
  EntradaSitemap,
  Ficha,
  Pagina,
  Tarjeta,
  TipoCambio,
} from "./tipos";

/**
 * Lecturas cacheadas. Las etiquetas son las que Django revalida
 * (backend/apps/comun/revalidacion.py): "articulos", "articulo-{id}", "catalogos" y "configuracion".
 */

export async function obtenerArticulos(params: Record<string, string>): Promise<Pagina<Tarjeta>> {
  "use cache";
  cacheTag("articulos");
  cacheLife("minutes");
  const query = new URLSearchParams(Object.entries(params).sort()).toString();
  return pedir(`/api/v1/articulos/${query ? `?${query}` : ""}`);
}

export async function obtenerDestacados(): Promise<Tarjeta[]> {
  "use cache";
  cacheTag("articulos");
  cacheLife("minutes");
  return pedir("/api/v1/destacados/");
}

export async function obtenerFicha(id: number): Promise<Ficha> {
  "use cache";
  cacheTag(`articulo-${id}`, "articulos");
  cacheLife("minutes");
  return pedir(`/api/v1/articulos/${id}/`);
}

export async function obtenerSimilares(id: number): Promise<Tarjeta[]> {
  "use cache";
  cacheTag(`articulo-${id}`, "articulos");
  cacheLife("minutes");
  return pedir(`/api/v1/articulos/${id}/similares/`);
}

export async function obtenerCatalogos(): Promise<Catalogos> {
  "use cache";
  cacheTag("catalogos");
  cacheLife("hours");
  return pedir("/api/v1/catalogos/");
}

export async function obtenerConfiguracion(): Promise<Configuracion> {
  "use cache";
  cacheTag("configuracion");
  cacheLife("hours");
  return pedir("/api/v1/configuracion/");
}

export async function obtenerTipoCambio(): Promise<TipoCambio | null> {
  "use cache";
  cacheLife("hours");
  return pedir<TipoCambio>("/api/v1/tipo-cambio/").catch(() => null);
}

export async function obtenerSitemap(): Promise<EntradaSitemap[]> {
  "use cache";
  cacheTag("articulos");
  cacheLife("hours");
  return pedir("/api/v1/sitemap/");
}
