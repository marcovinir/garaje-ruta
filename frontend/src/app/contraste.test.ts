import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Contraste de los tokens de `globals.css` en los dos modos (WCAG 2.2: 4,5:1 para texto y 3:1
 * para el borde de los campos). El modo oscuro solo lo usa el panel (`data-tema="oscuro"`).
 */
const css = readFileSync(resolve(__dirname, "globals.css"), "utf8");

function tokens(bloque: string): Record<string, string> {
  return Object.fromEntries(
    [...bloque.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, n, v]) => [n, v]),
  );
}

const claro = tokens(css.match(/@theme\s*\{([\s\S]*?)\n\}/)?.[1] ?? "");
const oscuro = {
  ...claro,
  ...tokens(css.match(/\[data-tema="oscuro"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? ""),
};

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const BLANCO = "#ffffff";
// [texto, fondo, mínimo]; "blanco" es el text-white de los botones y avisos.
const PARES: [string, string, number][] = [
  ...["fondo", "tarjeta", "campo"].flatMap((f): [string, string, number][] => [
    ["tinta", f, 4.5],
    ["tinta-suave", f, 4.5],
  ]),
  ["rojo-oscuro", "tarjeta", 4.5],
  ["rojo-oscuro", "fondo", 4.5],
  ["rojo-oscuro", "rojo-suave", 4.5],
  ["blanco", "rojo", 4.5],
  ["blanco", "rojo-fuerte", 4.5],
  ["blanco", "carbon", 4.5],
  ["disponible-tinta", "disponible", 4.5],
  ["reservado-tinta", "reservado", 4.5],
  ["vendido-tinta", "vendido", 4.5],
  ["agotado-tinta", "agotado", 4.5],
  ["borde-campo", "campo", 3],
  ["borde-campo", "tarjeta", 3],
];

describe("contraste de la paleta", () => {
  it("el modo oscuro existe y redefine los colores de fondo y de texto", () => {
    expect(oscuro.fondo).not.toBe(claro.fondo);
    expect(oscuro.tinta).not.toBe(claro.tinta);
  });

  it.each([
    ["claro", claro],
    ["oscuro", oscuro],
  ])("el modo %s cumple el contraste mínimo", (_, paleta) => {
    const color = (n: string) => (n === "blanco" ? BLANCO : paleta[n]);
    const fallos = PARES.filter(([t, f, min]) => !(contraste(color(t), color(f)) >= min)).map(
      ([t, f, min]) => `${t} sobre ${f}: ${contraste(color(t), color(f)).toFixed(2)} < ${min}`,
    );
    expect(fallos).toEqual([]);
  });
});

describe("diálogos del panel", () => {
  it("oscurecen lo que queda detrás, para que el diálogo se separe del fondo en los dos modos", () => {
    const regla = css.match(/\.dialogo-panel::backdrop\s*\{([^}]*)\}/)?.[1] ?? "";
    const alfa = Number(regla.match(/\/\s*([\d.]+)\s*\)/)?.[1] ?? 0);
    expect(alfa).toBeGreaterThanOrEqual(0.5);
  });
});
