/** El id es el número tras el último guion (igual que `id_de_ruta` en Django). */
export function idDeSlug(slug: string): number | null {
  const ultimo = slug.split("-").pop() ?? "";
  return /^\d+$/.test(ultimo) ? Number(ultimo) : null;
}

export function sitioUrl(): string {
  return (process.env.SITIO_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function urlAbsoluta(ruta: string): string {
  return `${sitioUrl()}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}
