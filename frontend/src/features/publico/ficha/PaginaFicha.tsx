import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { obtenerConfiguracion, obtenerSimilares } from "@/shared/api/datos";
import {
  type CondicionesComerciales,
  type FichaCompleta,
  type FichaNoDisponible,
  type Tarjeta,
  esFichaCompleta,
} from "@/shared/api/tipos";
import { colones, dolares } from "@/shared/lib/dinero";
import { urlAbsoluta } from "@/shared/lib/rutas";
import { enlaceWhatsappGeneral } from "@/shared/lib/whatsapp";

import { IconoWhatsapp } from "../componentes/BotonWhatsapp";
import { BotonesWhatsappFicha } from "../componentes/BotonesWhatsappFicha";
import { Esqueleto } from "../componentes/Esqueleto";
import { EtiquetaEstado } from "../componentes/EtiquetaEstado";
import { MensajeError } from "../componentes/MensajeError";
import { Precio } from "../componentes/Precio";
import { TarjetaArticulo } from "../componentes/TarjetaArticulo";
import { Compartir } from "./Compartir";
import { ContadorVistas } from "./ContadorVistas";
import { DatosAuto, DatosRepuesto, ResumenAuto } from "./Datos";
import { Galeria } from "./Galeria";
import { type Seccion, cargarFicha } from "./cargar";
import {
  CondicionesRepuesto,
  IdentificacionRepuesto,
  resumenRepuesto,
} from "./datosComercialesRepuesto";

const LISTADO = {
  auto: { href: "/autos", nombre: "Autos" },
  repuesto: { href: "/repuestos", nombre: "Repuestos" },
} as const;

function Similares({
  tarjetas,
  titulo = "Te pueden interesar",
}: {
  tarjetas: Tarjeta[];
  titulo?: string;
}) {
  if (!tarjetas.length) return null;
  if (titulo === "Te pueden interesar" && tarjetas[0].tipo === "repuesto") {
    titulo = "Repuestos relacionados";
  }
  return (
    <section aria-labelledby="similares" className="flex flex-col gap-4">
      <h2 id="similares" className="titulo text-3xl">
        {titulo}
      </h2>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.slice(0, 3).map((t) => (
          <li key={t.id} className="grid">
            <TarjetaArticulo tarjeta={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoDisponible({
  ficha,
  similares,
  whatsapp,
}: {
  ficha: FichaNoDisponible;
  similares: Tarjeta[];
  whatsapp: string | null;
}) {
  const cosa = ficha.tipo === "auto" ? "auto" : "repuesto";
  const titulo = {
    vendido: `Este ${cosa} ya se vendió`,
    agotado: "Este repuesto se agotó",
    no_disponible: "Este artículo ya no está disponible",
  }[ficha.estado_publico];
  const listado = LISTADO[ficha.tipo];
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6">
      <section className="bg-tarjeta border-borde flex flex-col items-center gap-4 rounded-3xl border px-6 py-10 text-center">
        {ficha.estado_publico !== "no_disponible" ? (
          <EtiquetaEstado estado={ficha.estado_publico} />
        ) : null}
        <h1 className="titulo text-4xl sm:text-5xl">{titulo}</h1>
        {ficha.titulo ? <p className="text-lg font-semibold">{ficha.titulo}</p> : null}
        <p className="text-tinta-suave max-w-md">
          Mirá estos parecidos o escribinos: si nos entra uno igual, te avisamos.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={listado.href}
            className="bg-carbon inline-flex min-h-11 items-center rounded-xl px-5 font-semibold text-white"
          >
            Ver {listado.nombre.toLowerCase()} disponibles
          </Link>
          {whatsapp ? (
            <a
              href={enlaceWhatsappGeneral(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp-fuerte hover:bg-whatsapp-fuerte-hover inline-flex min-h-11 items-center gap-2 rounded-xl px-5 font-semibold text-white"
            >
              <IconoWhatsapp />
              Escribinos por WhatsApp
            </a>
          ) : null}
        </div>
      </section>
      <Similares tarjetas={similares} />
    </div>
  );
}

function resumen(f: FichaCompleta): string {
  if (f.repuesto) {
    const r = f.repuesto;
    return resumenRepuesto(r);
  }
  return "";
}

function ContactoFicha({
  ficha,
  numero,
  compacto = false,
  soloCompatibilidad = false,
}: {
  ficha: FichaCompleta;
  numero: string;
  compacto?: boolean;
  soloCompatibilidad?: boolean;
}) {
  const comun = { precio: ficha.precio_colones, url: urlAbsoluta(ficha.ruta) };
  if (ficha.auto)
    return (
      <BotonesWhatsappFicha
        numero={numero}
        tipo="auto"
        datos={{
          ...comun,
          nombre: ficha.auto.nombre_vehiculo,
          anio: ficha.auto.anio,
        }}
        compacto={compacto}
      />
    );
  return (
    <BotonesWhatsappFicha
      numero={numero}
      tipo="repuesto"
      datos={{ ...comun, nombre: ficha.titulo, numeroParte: ficha.repuesto?.numero_parte }}
      compacto={compacto}
      soloCompatibilidad={soloCompatibilidad}
    />
  );
}

function Completa({
  ficha,
  similares,
  whatsapp,
  configuracion,
}: {
  ficha: FichaCompleta;
  similares: Tarjeta[];
  whatsapp: string | null;
  configuracion: CondicionesComerciales | null;
}) {
  const url = urlAbsoluta(ficha.ruta);
  const listado = LISTADO[ficha.tipo];
  const fotos = ficha.fotos.length ? ficha.fotos : ficha.foto ? [ficha.foto] : [];
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-6 pb-12 sm:px-6">
      <ContadorVistas id={ficha.id} tipo={ficha.tipo} />
      <div className="flex flex-col gap-4">
        <nav aria-label="Ruta de navegación" className="text-tinta-suave text-sm">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-tinta">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href={listado.href} className="hover:text-tinta">
                {listado.nombre}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-tinta truncate font-semibold">
              {ficha.titulo}
            </li>
          </ol>
        </nav>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="min-w-0">
            <Galeria fotos={fotos} titulo={ficha.titulo} />
          </div>
          <aside
            aria-label="Precio y contacto"
            className="bg-tarjeta border-borde flex flex-col gap-4 rounded-2xl border p-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <div className="flex flex-wrap gap-2">
              {ficha.tipo === "auto" || ficha.estado_publico === "reservado" ? (
                <EtiquetaEstado estado={ficha.estado_publico} />
              ) : null}
              {ficha.precio_anterior_colones ? (
                <span className="bg-rojo rounded-md px-2 py-1 text-xs font-bold text-white">
                  OFERTA
                </span>
              ) : null}
              {ficha.repuesto && ficha.estado_publico === "disponible" ? (
                <EtiquetaEstado estado={ficha.repuesto.cantidad === 0 ? "agotado" : "disponible"} />
              ) : null}
            </div>
            <h1 className="titulo text-4xl leading-none">{ficha.titulo}</h1>
            {!ficha.auto && <p className="text-tinta-suave">{resumen(ficha)}</p>}
            <Precio
              colones={ficha.precio_colones}
              dolares={ficha.precio_usd}
              anterior={ficha.precio_anterior_colones}
              mostrarAhorro
              tamano="ficha"
            />
            {ficha.auto && <ResumenAuto auto={ficha.auto} />}
            {whatsapp ? (
              <div>
                <ContactoFicha ficha={ficha} numero={whatsapp} />
              </div>
            ) : null}
            {ficha.repuesto && <IdentificacionRepuesto repuesto={ficha.repuesto} />}
            <Compartir titulo={ficha.titulo} url={url} />
          </aside>
          <div className="flex min-w-0 flex-col gap-8">
            {(ficha.auto ? ficha.descripcion.trim() : ficha.descripcion) ? (
              <section aria-labelledby="descripcion" className="flex flex-col gap-3">
                <h2 id="descripcion" className="titulo text-2xl">
                  Descripción
                </h2>
                <p className="leading-relaxed whitespace-pre-line">{ficha.descripcion}</p>
              </section>
            ) : null}
            {ficha.auto ? <DatosAuto auto={ficha.auto} /> : null}
            {ficha.repuesto ? <DatosRepuesto repuesto={ficha.repuesto} /> : null}
            {ficha.repuesto && !ficha.repuesto.compatibilidades.length && (
              <section aria-labelledby="compatibilidad" className="flex flex-col gap-3">
                <h2 id="compatibilidad" className="titulo text-2xl">
                  Compatibilidad
                </h2>
                <div className="bg-tarjeta border-borde flex flex-col items-start gap-3 rounded-2xl border p-4">
                  <p>Consultá la compatibilidad con tu vehículo</p>
                  {whatsapp && <ContactoFicha ficha={ficha} numero={whatsapp} soloCompatibilidad />}
                </div>
              </section>
            )}
            {ficha.repuesto && configuracion && (
              <CondicionesRepuesto configuracion={configuracion} />
            )}
          </div>
        </div>
      </div>
      <Similares
        tarjetas={similares}
        titulo={ficha.tipo === "auto" ? "Vehículos relacionados" : undefined}
      />
      {whatsapp ? (
        // En el celular el botón queda fijo abajo, con el precio a la vista.
        <div className="barra-fija bg-tarjeta/95 border-borde fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="titulo text-2xl leading-none">{colones(ficha.precio_colones)}</span>
              {ficha.precio_usd !== null ? (
                <span className="text-tinta-suave text-xs">{dolares(ficha.precio_usd)}</span>
              ) : null}
            </div>
            <ContactoFicha ficha={ficha} numero={whatsapp} compacto />
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Props = { seccion: Seccion; slug: string };

export async function PaginaFicha({ seccion, slug }: Props) {
  // Si Django falla, un aviso dentro de la página; notFound() y la redirección siguen de largo.
  const ficha = await cargarFicha(seccion, slug).catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  if (ficha === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <MensajeError texto="No pudimos cargar este artículo. Probá de nuevo en un momento." />
      </div>
    );
  }
  const [configuracion, similares] = await Promise.all([
    obtenerConfiguracion().catch(() => null),
    obtenerSimilares(ficha.id).catch((): Tarjeta[] => []),
  ]);
  const whatsapp = configuracion?.whatsapp || null;
  if (!esFichaCompleta(ficha)) {
    return <NoDisponible ficha={ficha} similares={similares} whatsapp={whatsapp} />;
  }
  return (
    <Completa
      ficha={ficha.repuesto ? { ...ficha, descripcion: ficha.descripcion.trim() } : ficha}
      similares={similares}
      whatsapp={whatsapp}
      configuracion={configuracion}
    />
  );
}

function EsqueletoFicha() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-12 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Esqueleto alto="aspect-[4/3]" />
      <Esqueleto alto="h-80" />
    </div>
  );
}

type PropsRuta = { seccion: Seccion; params: Promise<{ slug: string }> };

async function ConParams({ seccion, params }: PropsRuta) {
  const { slug } = await params;
  return <PaginaFicha seccion={seccion} slug={slug} />;
}

/** La página de la ruta: el 308 y el 404 ya los decidió `proxy.ts`; aquí se renderiza en streaming. */
export function RutaFicha(props: PropsRuta) {
  return (
    <Suspense fallback={<EsqueletoFicha />}>
      <ConParams {...props} />
    </Suspense>
  );
}
