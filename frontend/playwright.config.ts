import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de las historias HU-01 a HU-04 contra la app completa (Django + `next start`), en un
 * celular y en escritorio. En CI: job `e2e` de `.github/workflows/ci.yml`. En local, con el
 * stack levantado: `npm run e2e`. Contra producción (solo lectura): `E2E_URL=https://… npx
 * playwright test ficha.spec.ts`.
 */
export default defineConfig({
  testDir: "./e2e",
  // Las pruebas cambian datos compartidos (venden y publican): una a la vez.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    locale: "es-CR",
    timezoneId: "America/Costa_Rica",
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
});
