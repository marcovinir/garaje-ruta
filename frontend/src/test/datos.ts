/** Datos de prueba del panel, con la forma de la API del Plan 2 y valores parecidos a `sembrar`. */
import type { Catalogos, FotoApi } from "@/shared/api/tipos";

export type Rol = "admin" | "colaborador" | "demo";

// Igual que backend/apps/cuentas/permisos.py.
const DEMO = ["articulos.ver", "reportes.ver", "historial.ver"];
const COLABORADOR = [
  ...DEMO,
  "articulos.crear",
  "articulos.editar",
  "articulos.cambiar_estado",
  "ventas.registrar",
  "catalogos.agregar",
];
const ADMIN = [
  ...COLABORADOR,
  "articulos.eliminar",
  "catalogos.gestionar",
  "usuarios.gestionar",
  "configuracion.editar",
];
export const PERMISOS: Record<Rol, string[]> = {
  admin: ADMIN,
  colaborador: COLABORADOR,
  demo: DEMO,
};

export function yoDe(rol: Rol) {
  const id = { admin: 1, colaborador: 2, demo: 3 }[rol];
  return {
    id,
    email: `${rol}@garajeruta.test`,
    nombre: { admin: "Ana", colaborador: "Carlos", demo: "Demo" }[rol],
    apellidos: "Prueba",
    rol,
    permisos: PERMISOS[rol],
  };
}

export const CATALOGOS: Catalogos = {
  marcas: [
    {
      id: 13,
      nombre: "Toyota",
      slug: "toyota",
      modelos: [
        { id: 40, nombre: "Corolla", slug: "corolla" },
        { id: 41, nombre: "RAV4", slug: "rav4" },
      ],
    },
    {
      id: 15,
      nombre: "Nissan",
      slug: "nissan",
      modelos: [{ id: 55, nombre: "Sentra", slug: "sentra" }],
    },
  ],
  categorias: [
    {
      id: 1,
      nombre: "Frenos",
      slug: "frenos",
      hijas: [{ id: 2, nombre: "Pastillas", slug: "pastillas", hijas: [] }],
    },
  ],
  transmisiones: [
    { id: 1, nombre: "Manual" },
    { id: 2, nombre: "Automática" },
  ],
  combustibles: [
    { id: 1, nombre: "Gasolina" },
    { id: 2, nombre: "Diésel" },
    { id: 3, nombre: "Eléctrico" },
    { id: 4, nombre: "Híbrido enchufable" },
    { id: 5, nombre: "Híbrido" },
  ],
  tracciones: [{ id: 1, nombre: "4x2" }],
  carrocerias: [{ id: 1, nombre: "Sedán", slug: "sedan" }],
  equipamiento: [
    {
      grupo: "Confort",
      items: [
        { id: 1, nombre: "Aire acondicionado", filtrable: true },
        { id: 2, nombre: "Vidrios eléctricos", filtrable: true },
      ],
    },
  ],
};

export const FOTO: FotoApi = { public_id: "garaje-ruta/ejemplo/auto-01", ancho: 1600, alto: 1200 };

type Fila = {
  id: number;
  tipo: "auto" | "repuesto";
  titulo: string;
  estado: "disponible" | "reservado" | "oculto" | "vendido";
  cantidad: number | null;
  agotado: boolean;
  precio_colones: number;
};

function fila({ id, tipo, titulo, estado, cantidad, agotado, precio_colones }: Fila) {
  const slug = titulo.toLowerCase().replaceAll(" ", "-");
  return {
    id,
    tipo,
    titulo,
    ruta: `/${tipo === "auto" ? "autos" : "repuestos"}/${slug}-${id}`,
    precio_colones,
    precio_anterior_colones: null,
    precio_usd: Math.round(precio_colones / 4500) * 10,
    foto: FOTO,
    auto:
      tipo === "auto"
        ? { anio: 2015, kilometraje: 82000, transmision: "Automática", combustible: "Gasolina" }
        : null,
    repuesto:
      tipo === "repuesto"
        ? {
            condicion: "nuevo" as const,
            categoria: "Pastillas",
            compatibilidad_resumen: "Corolla 2012–2016",
          }
        : null,
    estado,
    agotado,
    cantidad,
    destacado: false,
    fecha_venta: estado === "vendido" ? "2026-11-20T10:00:00-06:00" : null,
    actualizado_en: "2026-11-22T09:00:00-06:00",
  };
}

export const FILAS = [
  fila({
    id: 101,
    tipo: "auto",
    titulo: "Toyota Corolla 2015",
    estado: "disponible",
    cantidad: null,
    agotado: false,
    precio_colones: 6500000,
  }),
  fila({
    id: 102,
    tipo: "auto",
    titulo: "Nissan Sentra 2010",
    estado: "reservado",
    cantidad: null,
    agotado: false,
    precio_colones: 2900000,
  }),
  fila({
    id: 103,
    tipo: "auto",
    titulo: "Toyota RAV4 2018",
    estado: "vendido",
    cantidad: null,
    agotado: false,
    precio_colones: 13500000,
  }),
  fila({
    id: 201,
    tipo: "repuesto",
    titulo: "Pastillas de freno Corolla",
    estado: "disponible",
    cantidad: 2,
    agotado: false,
    precio_colones: 25000,
  }),
  fila({
    id: 202,
    tipo: "repuesto",
    titulo: "Disco de freno Sentra",
    estado: "disponible",
    cantidad: 0,
    agotado: true,
    precio_colones: 38000,
  }),
];

export const TIPO_CAMBIO = {
  fecha: "2026-11-24",
  compra: "441.10",
  venta: "447.84",
  fuente: "open.er-api.com",
  desactualizado: false,
};
