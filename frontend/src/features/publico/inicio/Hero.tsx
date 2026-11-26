import Image from "next/image";
import Link from "next/link";

import cargadorHero from "@/shared/lib/cargador-hero";

import { IconoWhatsapp } from "../componentes/BotonWhatsapp";

const FOTO_PATIO = "garaje-ruta/ejemplo/auto-24";
const BOTON =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2 text-center text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base";

export function Hero() {
  return (
    <section
      aria-labelledby="titular"
      className="bg-carbon relative isolate overflow-hidden text-white"
    >
      <Image
        src={FOTO_PATIO}
        loader={cargadorHero}
        alt=""
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="-z-20 object-cover object-center"
      />
      <div aria-hidden="true" className="bg-carbon/80 absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-9 sm:gap-6 sm:px-6 sm:py-16 lg:py-24">
        <p className="text-xs font-bold tracking-widest text-[#ffb3bd] sm:text-sm">
          PATIO DE AUTOS USADOS · HEREDIA
        </p>
        <h1 id="titular" className="titulo max-w-3xl text-4xl leading-none sm:text-6xl lg:text-7xl">
          Autos usados y repuestos en Heredia
        </h1>
        <p className="max-w-xl text-base sm:text-lg">
          Mirá fotos, precio y compatibilidad antes de venir. Consultá por WhatsApp.
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link href="/autos" className={`${BOTON} bg-rojo hover:bg-rojo-fuerte`}>
            Explorar autos
          </Link>
          <Link href="/repuestos" className={`${BOTON} border border-white hover:bg-white/10`}>
            Buscar repuestos
          </Link>
        </div>
      </div>
    </section>
  );
}

const BENEFICIOS = [
  {
    texto: "Autos revisados",
    trazo:
      "M5 11l1-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2l1 4M5 19v2m14-2v2M3 19v-5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5H3Zm5-4h.01m8 0h.01",
  },
  { texto: "Precios claros", trazo: "M3 12V4h8l10 10-8 8L3 12Zm4-4h.01" },
  {
    texto: "Compatibilidad de repuestos",
    trazo: "M9 3h6v5l4 4-4 4v5H9v-5l-4-4 4-4V3Zm0 9 2 2 4-4",
  },
  { texto: "Atención por WhatsApp", trazo: null },
];

export function Beneficios() {
  return (
    <div className="bg-tarjeta border-rojo border-t-4">
      <ul
        aria-label="Beneficios"
        className="mx-auto grid max-w-6xl grid-cols-2 gap-x-3 gap-y-4 px-4 py-5 sm:px-6 lg:grid-cols-4"
      >
        {BENEFICIOS.map(({ texto, trazo }) => (
          <li key={texto} className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            {trazo ? (
              <svg
                aria-hidden="true"
                className="text-rojo-oscuro size-6 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={trazo} />
              </svg>
            ) : (
              <span className="text-whatsapp-fuerte shrink-0">
                <IconoWhatsapp tamano={24} />
              </span>
            )}
            {texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
