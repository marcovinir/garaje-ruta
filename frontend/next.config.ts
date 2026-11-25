import type { NextConfig } from "next";

import { reescriturasApi } from "./src/shared/config/rewrites";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Metadatos siempre en el <head> (sin streaming): WhatsApp y Facebook ya los recibían ahí, pero
  // otros rastreadores y Lighthouse los buscaban en el <head> y no estaban. Nuestro
  // generateMetadata es barato (datos en caché o solo la URL).
  htmlLimitedBots: /.*/,
  experimental: {
    // Quien ya navega por la web reutiliza las páginas precargadas por este tiempo. 30 s (el
    // mínimo) en vez de 5 min: un auto vendido sale de su vista en menos de un minuto (HU-04).
    staleTimes: { static: 30 },
  },
  // Django usa barra final en sus URLs: Next no debe quitarla antes del rewrite.
  skipTrailingSlashRedirect: true,
  // Las fotos son public_id de Cloudinary: las transforma Cloudinary, no Next.
  images: { loader: "custom", loaderFile: "./src/shared/lib/cargador-imagenes.ts" },
  async rewrites() {
    return reescriturasApi(process.env.BACKEND_URL ?? "http://localhost:8000");
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
