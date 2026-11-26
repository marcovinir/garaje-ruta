export type Seccion = {
  etiqueta: string;
  subruta: string;
  permiso: string;
  /** Trazo SVG (24×24) del ícono. */
  icono: string;
};

/** Secciones del menú; solo se muestran las que el rol puede ver (§9). */
export const SECCIONES: Seccion[] = [
  {
    etiqueta: "Artículos",
    subruta: "articulos",
    permiso: "articulos.ver",
    icono:
      "M3 13l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6v5h-3m-12 0H3v-5m4 5a2 2 0 1 0 0-.01M17 18a2 2 0 1 0 0-.01M3 13h18",
  },
  {
    etiqueta: "Usuarios",
    subruta: "usuarios",
    permiso: "usuarios.gestionar",
    icono:
      "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6m13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8",
  },
  {
    etiqueta: "Reportes",
    subruta: "reportes",
    permiso: "reportes.ver",
    icono: "M4 20h16M6 16v-4m6 4V8m6 8V4",
  },
  {
    etiqueta: "Configuración",
    subruta: "configuracion",
    permiso: "articulos.ver",
    icono:
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1",
  },
  {
    etiqueta: "Catálogos",
    subruta: "catalogos",
    permiso: "catalogos.gestionar",
    icono: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  },
];

export const ICONO_NUEVO = "M12 5v14M5 12h14";
export const ICONO_MAS = "M5 12h.01M12 12h.01M19 12h.01";
export const ICONO_SALIR = "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9";
