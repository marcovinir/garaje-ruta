/** Montos para mostrar: `₡6 500 000` y, debajo, `≈ US$14 500` (espacio fino entre miles). */

const ESPACIO_FINO = " ";

function miles(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ESPACIO_FINO);
}

export function colones(n: number): string {
  return `₡${miles(n)}`;
}

export function dolares(n: number | null): string | null {
  return n === null ? null : `≈ US$${miles(n)}`;
}
