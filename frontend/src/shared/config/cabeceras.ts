/**
 * Cabeceras de seguridad para todas las rutas (web y panel). Ninguna página se puede incrustar en
 * un iframe de otro sitio (clickjacking): nada legítimo lo hace, y la ruta del panel es
 * configurable, así que se aplica a todo. La API ya las manda desde Django.
 */
export function cabecerasSeguridad() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ];
}
