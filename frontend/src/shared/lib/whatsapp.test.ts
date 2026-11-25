import { expect, it } from "vitest";

import {
  enlaceWhatsapp,
  enlaceConsultaAuto,
  enlaceVisitaAuto,
  enlaceConsultaRepuesto,
  enlaceCompatibilidadRepuesto,
} from "./whatsapp";

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

const numero = "50688887777";
const auto = {
  marca: "Mazda",
  modelo: "Mazda 3",
  anio: 2018,
  precio: 6500000,
  url: "https://garaje.test/autos/mazda-3-1",
};
const repuesto = {
  nombre: "Faro derecho Nissan X-Trail",
  precio: 85000,
  numeroParte: "ABC-123",
  url: "https://garaje.test/repuestos/faro-2",
};
it("consulta de auto: identidad sin marca duplicada, precio y codificación exacta", () => {
  const mensaje = `Hola, estoy interesado en el Mazda 3 2018 publicado en ₡6 500 000. ¿Todavía está disponible?\n${auto.url}`;
  expect(enlaceConsultaAuto(numero, auto)).toBe(
    `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  );
});
it("visita de auto: texto exacto y referencia al final", () => {
  const mensaje = `Hola, me gustaría coordinar una visita para conocer el Toyota Corolla 2018.\n${auto.url}\nReferencia: GR-123`;
  expect(
    enlaceVisitaAuto(numero, { ...auto, marca: "Toyota", modelo: "Corolla", referencia: "GR-123" }),
  ).toBe(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`);
});
it("consulta de repuesto: precio y disponibilidad", () => {
  const mensaje = `Hola, estoy interesado en este repuesto: Faro derecho Nissan X-Trail, publicado en ₡85 000. Quisiera conocer su disponibilidad.\n${repuesto.url}`;
  expect(enlaceConsultaRepuesto(numero, repuesto)).toBe(
    `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  );
});
it("compatibilidad: número de parte y renglones del vehículo", () => {
  const mensaje = `Hola, quisiera confirmar si el siguiente repuesto es compatible con mi vehículo:\nRepuesto: Faro derecho Nissan X-Trail\nNúmero de parte: ABC-123\nMarca de mi vehículo:\nModelo:\nAño:\nMotor:\n${repuesto.url}`;
  expect(enlaceCompatibilidadRepuesto(numero, repuesto)).toBe(
    `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  );
});
it("omite el número de parte vacío y permite referencias en todos los contextos", () => {
  for (const numeroParte of [undefined, "", "  "]) {
    expect(
      new URL(enlaceCompatibilidadRepuesto(numero, { ...repuesto, numeroParte })).searchParams.get(
        "text",
      ),
    ).not.toContain("Número de parte:");
  }
  for (const enlace of [
    enlaceConsultaAuto(numero, { ...auto, referencia: "GR-5" }),
    enlaceVisitaAuto(numero, { ...auto, referencia: "GR-5" }),
    enlaceConsultaRepuesto(numero, { ...repuesto, referencia: "GR-5" }),
    enlaceCompatibilidadRepuesto(numero, { ...repuesto, referencia: "GR-5" }),
  ]) {
    expect(new URL(enlace).searchParams.get("text")).toMatch(/\nReferencia: GR-5$/);
  }
});

it("con piezas en femenino el mensaje sigue siendo correcto (no «en el Batería»)", () => {
  const texto = new URL(
    enlaceConsultaRepuesto(numero, { ...repuesto, nombre: "Batería Hyundai Accent" }),
  ).searchParams.get("text");
  expect(texto).toContain("en este repuesto: Batería Hyundai Accent,");
  expect(texto).not.toContain("en el Batería");
});
