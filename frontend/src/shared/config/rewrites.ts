export type Reescritura = { source: string; destination: string };

/**
 * Reenvía /api/v1/* a Django en el mismo origen, para que la cookie de sesión y el CSRF
 * funcionen sin CORS. La barra final del destino es la que esperan las URLs de Django.
 */
export function reescriturasApi(backendUrl: string): Reescritura[] {
  const base = backendUrl.replace(/\/+$/, "");
  return [{ source: "/api/v1/:ruta*", destination: `${base}/api/v1/:ruta*/` }];
}
