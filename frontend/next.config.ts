import type { NextConfig } from "next";

import { reescriturasApi } from "./src/shared/config/rewrites";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Django usa barra final en sus URLs: Next no debe quitarla antes del rewrite.
  skipTrailingSlashRedirect: true,
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
