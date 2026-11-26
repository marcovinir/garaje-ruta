import Link from "next/link";
import { connection } from "next/server";

import { obtenerArticulos, obtenerCatalogos, obtenerConfiguracion } from "@/shared/api/datos";
import { enlaceWhatsappGeneral } from "@/shared/lib/whatsapp";

import { IconoWhatsapp } from "../componentes/BotonWhatsapp";
import { MensajeError } from "../componentes/MensajeError";
import { resumirHorarios } from "../componentes/PieDePagina";
import { TarjetaArticulo } from "../componentes/TarjetaArticulo";
import { BuscadorCompatible } from "./BuscadorCompatible";
import { RegistroVistaOfertas } from "./RegistroVistaOfertas";

const RECIENTES = {
  auto: {
    id: "autos-nuevos",
    titulo: "Autos recién llegados",
    enlace: "/autos",
    texto: "Ver todos los autos",
  },
  repuesto: {
    id: "repuestos-nuevos",
    titulo: "Repuestos recién llegados",
    enlace: "/repuestos",
    texto: "Ver todos los repuestos",
  },
};

async function Coleccion({
  id,
  titulo,
  enlace,
  texto,
  filtros,
}: {
  id: string;
  titulo: string;
  enlace: string;
  texto: string;
  filtros: Record<string, string>;
}) {
  await connection();
  const pagina = await obtenerArticulos(filtros).catch(() => null);
  if (pagina === null) return <MensajeError />;
  if (!pagina.results.length) return null;
  return (
    <section aria-labelledby={id}>
      {id === "ofertas" ? <RegistroVistaOfertas tituloId={id} /> : null}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id={id} className="titulo text-3xl sm:text-4xl">
          {titulo}
        </h2>
        <Link
          href={enlace}
          className="text-rojo-oscuro inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"
        >
          {texto} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pagina.results.map((t) => (
          <li key={t.id} className="grid min-w-0">
            <TarjetaArticulo tarjeta={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Ofertas() {
  return Coleccion({
    id: "ofertas",
    titulo: "Ofertas",
    enlace: "/autos?ofertas=1",
    texto: "Ver todas",
    filtros: { tipo: "auto", ofertas: "1", tamano: "4" },
  });
}

export function RecienLlegados({ tipo }: { tipo: keyof typeof RECIENTES }) {
  return Coleccion({ ...RECIENTES[tipo], filtros: { tipo, orden: "recientes", tamano: "4" } });
}

export async function Carrocerias() {
  await connection();
  const catalogos = await obtenerCatalogos().catch(() => null);
  if (!catalogos?.carrocerias.length) return null;
  return (
    <section aria-labelledby="carrocerias">
      <h2 id="carrocerias" className="titulo mb-4 text-3xl sm:text-4xl">
        Carrocerías
      </h2>
      <nav aria-label="Buscar por tipo de vehículo" className="flex flex-wrap gap-2.5">
        {catalogos.carrocerias.map((c) => (
          <Link
            key={c.id}
            href={`/autos?carroceria=${c.slug}`}
            className="bg-tarjeta border-borde hover:border-rojo inline-flex min-h-11 items-center rounded-full border px-4 font-medium"
          >
            {c.nombre}
          </Link>
        ))}
      </nav>
    </section>
  );
}

export async function Compatibilidad() {
  await connection();
  const catalogos = await obtenerCatalogos().catch(() => null);
  if (!catalogos?.marcas.some((m) => m.modelos.length)) return null;
  return <BuscadorCompatible marcas={catalogos.marcas} />;
}

export async function ResumenContacto() {
  await connection();
  const configuracion = await obtenerConfiguracion().catch(() => null);
  const horarios = resumirHorarios(configuracion?.horarios ?? []);
  return (
    <section
      aria-labelledby="contacto-inicio"
      className="bg-tarjeta border-borde flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="contacto-inicio" className="titulo mb-2 text-3xl sm:text-4xl">
          Contacto y ubicación
        </h2>
        <p className="font-semibold break-words">
          {configuracion?.direccion || "Heredia, Costa Rica"}
        </p>
        {horarios.map((horario) => (
          <p key={horario} className="text-tinta-suave">
            {horario}
          </p>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {configuracion?.whatsapp && (
          <a
            href={enlaceWhatsappGeneral(configuracion.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-whatsapp-fuerte hover:bg-whatsapp-fuerte-hover inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold text-white"
          >
            <IconoWhatsapp /> Escribinos por WhatsApp
          </a>
        )}
        <Link
          href="/contacto"
          className="text-rojo-oscuro inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
        >
          Ver contacto y ubicación
        </Link>
      </div>
    </section>
  );
}
