import { afterEach, expect, it, vi } from "vitest";

import { idDeSlug, urlAbsoluta } from "./rutas";

it("saca el id del final del slug", () => {
  expect(idDeSlug("toyota-corolla-2015-12")).toBe(12);
  expect(idDeSlug("12")).toBe(12);
  expect(idDeSlug("abc")).toBeNull();
  expect(idDeSlug("toyota-")).toBeNull();
});

afterEach(() => vi.unstubAllEnvs());

it("arma URLs absolutas con SITIO_URL", () => {
  vi.stubEnv("SITIO_URL", "https://garajeruta.test/");
  expect(urlAbsoluta("/autos/x-1")).toBe("https://garajeruta.test/autos/x-1");
});
