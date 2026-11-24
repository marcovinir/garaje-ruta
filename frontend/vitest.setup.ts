import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { reiniciarNavegacion } from "./src/test/navegacion";

// Sin `globals`, Testing Library no limpia el DOM entre pruebas por sí sola.
afterEach(() => {
  cleanup();
  reiniciarNavegacion();
});

// Fuera de Next no hay router: el panel usa uno falso (ver src/test/navegacion.ts).
vi.mock("next/navigation", async () => (await import("./src/test/navegacion")).moduloNavegacion);
