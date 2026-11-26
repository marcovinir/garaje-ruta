import { colones } from "@/shared/lib/dinero";

export const ACCIONES = {
  crear: "Creó",
  editar: "Editó",
  cambiar_estado: "Cambió el estado",
  vender: "Registró una venta",
  deshacer_venta: "Deshizo una venta",
  fotos: "Cambió las fotos",
  eliminar: "Eliminó",
} as const;

export type Accion = keyof typeof ACCIONES;
type Referencia = { id: number; nombre: string };
export type Autor = Referencia;
export type Cambio = {
  id: number;
  fecha: string;
  accion: Accion;
  accion_texto: string;
  usuario: Referencia;
  articulo: { id: number | null; titulo: string };
  detalle: Record<string, unknown>;
};

const CAMPOS: Record<string, string> = {
  titulo: "Título",
  descripcion: "Descripción",
  precio_colones: "Precio",
  precio_anterior_colones: "Precio anterior",
  estado: "Estado",
  anio: "Año",
  modelo: "Modelo",
  codigo_interno: "Código interno",
  categoria_pieza: "Categoría",
  numero_parte: "Número de parte",
  color_exterior: "Color exterior",
  color_interior: "Color interior",
  marchamo_anio: "Año del marchamo",
  riteve_vence: "Vencimiento de inspección técnica",
  bateria_kwh: "Capacidad de la batería",
  bateria_salud_pct: "Salud de la batería",
  autonomia_km: "Autonomía",
  sin_gravamenes: "Sin gravámenes",
  unico_dueno: "Único dueño",
};
const ESTADOS: Record<string, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  oculto: "Oculto",
  vendido: "Vendido",
};

function valor(dato: unknown, campo?: string): string {
  if (dato == null || dato === "") return "Sin dato";
  if (typeof dato === "boolean") return dato ? "Sí" : "No";
  if (
    typeof dato === "number" &&
    (campo === "precio_colones" || campo === "precio_anterior_colones")
  ) {
    return colones(dato);
  }
  if (campo === "estado" && typeof dato === "string") return ESTADOS[dato] ?? dato;
  if (Array.isArray(dato)) return dato.length ? dato.map((v) => valor(v)).join(", ") : "Sin datos";
  return typeof dato === "string" || typeof dato === "number" ? String(dato) : "Sin detalle";
}

export function resumirCambio({ accion, detalle, accion_texto }: Cambio): string[] {
  const par = (campo: string) =>
    valor(detalle.antes, campo) + " → " + valor(detalle.despues, campo);

  switch (accion) {
    case "crear":
      return [
        typeof detalle.duplicado_de === "number"
          ? "Duplicó el artículo #" + detalle.duplicado_de
          : "Creó el artículo",
      ];
    case "editar": {
      const cambios = Object.entries(detalle).flatMap(([campo, datos]) => {
        if (!Array.isArray(datos) || datos.length !== 2) return [];
        const crudo = campo.replaceAll("_", " ");
        const etiqueta = CAMPOS[campo] ?? crudo.charAt(0).toUpperCase() + crudo.slice(1);
        return [etiqueta + ": " + valor(datos[0], campo) + " → " + valor(datos[1], campo)];
      });
      return cambios.length ? cambios : ["Editó el artículo"];
    }
    case "cambiar_estado":
      return ["Estado: " + par("estado")];
    case "fotos":
      return ["Fotos: " + par("fotos")];
    case "vender":
      return [
        typeof detalle.cantidad === "number" ? "Vendió " + detalle.cantidad : "Registró una venta",
      ];
    case "deshacer_venta":
      return [
        typeof detalle.cantidad === "number"
          ? "Deshizo la venta de " + detalle.cantidad
          : "Deshizo una venta",
      ];
    case "eliminar":
      return ["Eliminó el artículo"];
    default:
      return [accion_texto];
  }
}
