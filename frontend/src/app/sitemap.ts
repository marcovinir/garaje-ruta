import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { obtenerSitemap } from "@/shared/api/datos";
import { urlAbsoluta } from "@/shared/lib/rutas";

/**
 * Se arma en cada petición (`connection()`), así el build no llama a Django; los datos vienen
 * de la caché con la etiqueta "articulos", que Django revalida al vender o publicar.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const fijas: MetadataRoute.Sitemap = [
    { url: urlAbsoluta("/"), changeFrequency: "daily", priority: 1 },
    { url: urlAbsoluta("/autos"), changeFrequency: "daily", priority: 0.9 },
    { url: urlAbsoluta("/repuestos"), changeFrequency: "daily", priority: 0.9 },
    { url: urlAbsoluta("/contacto"), changeFrequency: "monthly" },
  ];
  const articulos = await obtenerSitemap().catch(() => []);
  return [
    ...fijas,
    ...articulos.map((a) => ({
      url: urlAbsoluta(a.ruta),
      lastModified: new Date(a.actualizado_en),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
