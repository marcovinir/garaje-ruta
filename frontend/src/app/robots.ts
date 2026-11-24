import type { MetadataRoute } from "next";

import { urlAbsoluta } from "@/shared/lib/rutas";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
