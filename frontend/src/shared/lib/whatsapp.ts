import { colones } from "./dinero";

function enlaceMensaje(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function enlaceWhatsappGeneral(numero: string): string {
  const mensaje = "Hola, vengo de la web de Garaje Ruta.";
  return enlaceMensaje(numero, mensaje);
}

export function enlaceWhatsapp(numero: string, titulo: string, urlArticulo: string): string {
  const mensaje = `Hola, me interesa: ${titulo} – ${urlArticulo}`;
  return enlaceMensaje(numero, mensaje);
}

type ContextoWhatsapp = { url: string; referencia?: string };
export type AutoWhatsapp = ContextoWhatsapp & {
  nombre: string;
  anio: number;
  precio: number;
};
export type RepuestoWhatsapp = ContextoWhatsapp & {
  nombre: string;
  precio: number;
  numeroParte?: string;
};

function enlaceContextual(numero: string, mensaje: string, contexto: ContextoWhatsapp): string {
  const referencia = contexto.referencia?.trim();
  return enlaceMensaje(
    numero,
    [mensaje, contexto.url, ...(referencia ? [`Referencia: ${referencia}`] : [])].join("\n"),
  );
}

export function enlaceConsultaAuto(numero: string, auto: AutoWhatsapp): string {
  return enlaceContextual(
    numero,
    `Hola, estoy interesado en el ${auto.nombre} ${auto.anio} publicado en ${colones(auto.precio)}. ¿Todavía está disponible?`,
    auto,
  );
}

export function enlaceVisitaAuto(numero: string, auto: AutoWhatsapp): string {
  return enlaceContextual(
    numero,
    `Hola, me gustaría coordinar una visita para conocer el ${auto.nombre} ${auto.anio}.`,
    auto,
  );
}

export function enlaceConsultaRepuesto(numero: string, repuesto: RepuestoWhatsapp): string {
  return enlaceContextual(
    numero,
    `Hola, estoy interesado en este repuesto: ${repuesto.nombre}, publicado en ${colones(repuesto.precio)}. Quisiera conocer su disponibilidad.`,
    repuesto,
  );
}

export function enlaceCompatibilidadRepuesto(numero: string, repuesto: RepuestoWhatsapp): string {
  const numeroParte = repuesto.numeroParte?.trim();
  const mensaje = [
    "Hola, quisiera confirmar si el siguiente repuesto es compatible con mi vehículo:",
    `Repuesto: ${repuesto.nombre}`,
    ...(numeroParte ? [`Número de parte: ${numeroParte}`] : []),
    "Marca de mi vehículo:",
    "Modelo:",
    "Año:",
    "Motor:",
  ].join("\n");
  return enlaceContextual(numero, mensaje, repuesto);
}
