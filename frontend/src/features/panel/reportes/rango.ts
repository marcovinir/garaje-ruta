export const RANGOS = {
  "30-dias": "Últimos 30 días",
  "3-meses": "Últimos 3 meses",
  "6-meses": "Últimos 6 meses",
  "12-meses": "Últimos 12 meses",
} as const;

export type Rango = keyof typeof RANGOS;
export const RANGO_PREDETERMINADO: Rango = "6-meses";

const FECHA_LOCAL = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Costa_Rica" });

export function fechasDelRango(rango: Rango, hoy = new Date()) {
  const hasta = FECHA_LOCAL.format(hoy);
  const fecha = new Date(hasta + "T00:00:00Z");
  if (rango === "30-dias") {
    fecha.setUTCDate(fecha.getUTCDate() - 29);
  } else {
    const dia = fecha.getUTCDate();
    const meses = Number.parseInt(rango);
    fecha.setUTCDate(1);
    fecha.setUTCMonth(fecha.getUTCMonth() - meses);
    const ultimo = new Date(
      Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0),
    ).getUTCDate();
    fecha.setUTCDate(Math.min(ultimo, dia));
  }
  return { desde: fecha.toISOString().slice(0, 10), hasta };
}
