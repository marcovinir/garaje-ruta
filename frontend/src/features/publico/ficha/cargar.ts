import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { obtenerFicha } from "@/shared/api/datos";
import { type Ficha, type FichaCompleta, esFichaCompleta } from "@/shared/api/tipos";
import { urlFoto } from "@/shared/lib/cloudinary";
import { colones, miles } from "@/shared/lib/dinero";
import { idDeSlug, urlAbsoluta } from "@/shared/lib/rutas";

export type Seccion = "autos" | "repuestos";

const SECCION_DE = { auto: "autos", repuesto: "repuestos" } as const;

/**
 * Carga el artículo de la URL. El id es lo único que cuenta: si la sección o el texto no son los
 * actuales (el título cambió), redirige con 308 a la canónica; si no existe, 404.
 */
export async function cargarFicha(seccion: Seccion, slug: string): Promise<Ficha> {
  const id = idDeSlug(slug);
  if (id === null) notFound();
  const ficha = await obtenerFicha(id);
  if (ficha === null) notFound();
  if (ficha.ruta) {
    if (ficha.ruta !== `/${seccion}/${slug}`) permanentRedirect(ficha.ruta);
  } else if (SECCION_DE[ficha.tipo] !== seccion) {
    notFound();
  }
  return ficha;
}

function descripcion(f: FichaCompleta): string {
  const datos = f.auto
    ? [
        f.auto.anio,
        `${miles(f.auto.kilometraje)} km`,
        f.auto.transmision,
        f.auto.combustible,
        f.auto.carroceria,
      ]
    : f.repuesto
      ? [
          f.repuesto.condicion === "nuevo" ? "Nuevo" : "Usado",
          f.repuesto.categoria.nombre,
          ...f.repuesto.compatibilidades
            .slice(0, 2)
            .map((c) => `${c.marca} ${c.modelo} ${c.anio_desde}–${c.anio_hasta}`),
        ]
      : [];
  return `${colones(f.precio_colones)} · ${datos.join(" · ")}. Consultá por WhatsApp en Garaje Ruta, Heredia.`;
}

function imagenOg(f: FichaCompleta) {
  const principal = f.foto ?? f.fotos[0];
  if (!principal) return undefined;
  const url = urlFoto(principal.public_id, { ancho: 1200, alto: 630, recorte: true });
  return [
    {
      url: url.startsWith("/") ? urlAbsoluta(url) : url,
      width: 1200,
      height: 630,
      alt: f.titulo,
    },
  ];
}

/**
 * Metadatos de la ficha. No redirige ni da 404 (eso lo hace la página): los metadatos pueden
 * llegar en streaming y ahí una redirección ya no sería un 308.
 */
export async function metadataFicha(slug: string): Promise<Metadata> {
  const id = idDeSlug(slug);
  const ficha = id === null ? null : await obtenerFicha(id).catch(() => null);
  if (ficha === null) return { title: "Artículo no encontrado" };
  if (!esFichaCompleta(ficha)) {
    return {
      title: ficha.titulo ?? "Artículo no disponible",
      robots: { index: false, follow: true },
    };
  }
  const canonica = urlAbsoluta(ficha.ruta);
  const texto = descripcion(ficha);
  return {
    title: ficha.titulo,
    description: texto,
    alternates: { canonical: canonica },
    openGraph: {
      type: "website",
      url: canonica,
      title: ficha.titulo,
      description: texto,
      siteName: "Garaje Ruta",
      locale: "es_CR",
      images: imagenOg(ficha),
    },
    twitter: { card: "summary_large_image" },
  };
}
