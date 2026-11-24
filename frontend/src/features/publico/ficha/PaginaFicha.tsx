import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { obtenerConfiguracion, obtenerSimilares } from "@/shared/api/datos";
import {
  type FichaCompleta,
  type FichaNoDisponible,
  type Tarjeta,
  esFichaCompleta,
} from "@/shared/api/tipos";
import { colones, dolares, miles } from "@/shared/lib/dinero";
import { urlAbsoluta } from "@/shared/lib/rutas";
import { enlaceWhatsappGeneral } from "@/shared/lib/whatsapp";

import { BotonWhatsapp, IconoWhatsapp } from "../componentes/BotonWhatsapp";
import { Esqueleto } from "../componentes/Esqueleto";
import { EtiquetaEstado } from "../componentes/EtiquetaEstado";
import { MensajeError } from "../componentes/MensajeError";
import { Precio } from "../componentes/Precio";
import { TarjetaArticulo } from "../componentes/TarjetaArticulo";
import { Compartir } from "./Compartir";
import { ContadorVistas } from "./ContadorVistas";
import { DatosAuto, DatosRepuesto, Equipamiento } from "./Datos";
import { Galeria } from "./Galeria";
import { type Seccion, cargarFicha } from "./cargar";

const LISTADO = {
  auto: { href: "/autos", nombre: "Autos" },
  repuesto: { href: "/repuestos", nombre: "Repuestos" },
} as const;

function Similares({ tarjetas }: { tarjetas: Tarjeta[] }) {
  if (!tarjetas.length) return null;
  return (
    <section aria-labelledby="similares" className="flex flex-col gap-4">
      <h2 id="similares" className="titulo text-3xl">
        Te pueden interesar
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
              className="bg-rojo hover:bg-rojo-oscuro inline-flex min-h-11 items-center gap-2 rounded-xl px-5 font-semibold text-white"
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
  if (f.auto) {
    const a = f.auto;
    return `${a.anio} · ${miles(a.kilometraje)} km · ${a.transmision} · ${a.combustible}`;
  }
  if (f.repuesto) {
    const r = f.repuesto;
    return `${r.condicion === "nuevo" ? "Nuevo" : "Usado"} · ${r.categoria.nombre} · ${
      r.cantidad === 1 ? "Queda 1" : `${r.cantidad} disponibles`
    }`;
  }
  return "";
}

function Completa({
  ficha,
  similares,
  whatsapp,
}: {
  ficha: FichaCompleta;
  similares: Tarjeta[];
  whatsapp: string | null;
}) {
  const url = urlAbsoluta(ficha.ruta);
  const listado = LISTADO[ficha.tipo];
  const fotos = ficha.fotos.length ? ficha.fotos : ficha.foto ? [ficha.foto] : [];
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pt-6 pb-12 sm:px-6">
      <ContadorVistas id={ficha.id} />
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
              {ficha.estado_publico === "reservado" ? <EtiquetaEstado estado="reservado" /> : null}
              {ficha.precio_anterior_colones ? (
                <span className="bg-rojo rounded-md px-2 py-1 text-xs font-bold text-white">
                  OFERTA
                </span>
              ) : null}
            </div>
            <h1 className="titulo text-4xl leading-none">{ficha.titulo}</h1>
            <p className="text-tinta-suave">{resumen(ficha)}</p>
            <Precio
              colones={ficha.precio_colones}
              dolares={ficha.precio_usd}
              anterior={ficha.precio_anterior_colones}
              tamano="ficha"
            />
            {whatsapp ? (
              <div className="hidden lg:block">
                <BotonWhatsapp numero={whatsapp} titulo={ficha.titulo} url={url} />
              </div>
            ) : null}
            <Compartir titulo={ficha.titulo} url={url} />
          </aside>
          <div className="flex min-w-0 flex-col gap-8">
            {ficha.descripcion ? (
              <section aria-labelledby="descripcion" className="flex flex-col gap-3">
                <h2 id="descripcion" className="titulo text-2xl">
                  Descripción
                </h2>
                <p className="leading-relaxed whitespace-pre-line">{ficha.descripcion}</p>
              </section>
            ) : null}
            {ficha.auto ? (
              <>
                <DatosAuto auto={ficha.auto} />
                <Equipamiento grupos={ficha.auto.equipamiento} />
              </>
            ) : null}
            {ficha.repuesto ? <DatosRepuesto repuesto={ficha.repuesto} /> : null}
          </div>
        </div>
      </div>
      <Similares tarjetas={similares} />
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
            <BotonWhatsapp
              numero={whatsapp}
              titulo={ficha.titulo}
              url={url}
              texto="Consultar"
              className="flex-1"
            />
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
  return <Completa ficha={ficha} similares={similares} whatsapp={whatsapp} />;
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
