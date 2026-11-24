import { expect, it } from "vitest";

import { enlaceWhatsapp } from "./whatsapp";

it("arma el enlace de WhatsApp con el mensaje codificado", () => {
  const url = enlaceWhatsapp(
    "50688887777",
    "Toyota Corolla 2018 SE",
    "https://garajeruta.test/autos/toyota-corolla-2018-se-12",
  );
  expect(url.startsWith("https://wa.me/50688887777?text=")).toBe(true);
  expect(decodeURIComponent(url.split("text=")[1])).toBe(
    "Hola, me interesa: Toyota Corolla 2018 SE – https://garajeruta.test/autos/toyota-corolla-2018-se-12",
  );
});
