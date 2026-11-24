import Link from "next/link";
import { connection } from "next/server";

import { obtenerArticulos, obtenerCatalogos, obtenerDestacados } from "@/shared/api/datos";

import { MensajeError } from "../componentes/MensajeError";
import { TarjetaArticulo } from "../componentes/TarjetaArticulo";

/**
 * Secciones del inicio. Cada una espera la petición (`connection()`) para no consultar Django al
 * compilar, y atrapa sus errores: si Django falla, solo esa sección muestra un aviso.
 */

function Encabezado({
  id,
  titulo,
  enlace,
  texto,
}: {
  id: string;
  titulo: string;
  enlace: string;
  texto: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 id={id} className="titulo text-3xl sm:text-4xl">
        {titulo}
      </h2>
      <Link
        href={enlace}
        className="text-rojo-oscuro font-semibold underline-offset-4 hover:underline"
      >
        {texto} →
      </Link>
    </div>
  );
}

const REJILLA = "grid gap-5 sm:grid-cols-2 lg:grid-cols-4";

export async function Ofertas() {
  await connection();
  const pagina = await obtenerArticulos({ ofertas: "1" }).catch(() => null);
  if (pagina === null) return <MensajeError />;
  if (!pagina.results.length) return null;
  return (
    <section aria-labelledby="ofertas" className="aparece">
      <Encabezado id="ofertas" titulo="Ofertas" enlace="/autos?ofertas=1" texto="Ver todas" />
      <div className={REJILLA}>
        {pagina.results.slice(0, 4).map((t) => (
          <TarjetaArticulo key={t.id} tarjeta={t} />
        ))}
      </div>
    </section>
  );
}

export async function Destacados() {
  await connection();
  const destacados = await obtenerDestacados().catch(() => null);
  if (destacados === null) return <MensajeError />;
  return (
    <section aria-labelledby="recientes" className="aparece">
      <Encabezado
        id="recientes"
        titulo="Recién llegados"
        enlace="/autos"
        texto="Ver todo el inventario"
      />
      <div className={REJILLA}>
        {destacados.map((t, i) => (
          <TarjetaArticulo key={t.id} tarjeta={t} prioridad={i === 0} />
        ))}
      </div>
    </section>
  );
}

export async function Carrocerias() {
  await connection();
  const catalogos = await obtenerCatalogos().catch(() => null);
  if (catalogos === null) return null;
  return (
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
  );
}

function Acceso({
  href,
  titulo,
  detalle,
}: {
  href: string;
  titulo: string;
  detalle: string | null;
}) {
  return (
    <Link
      href={href}
      className="tarjeta-animada bg-tarjeta border-borde flex items-center justify-between gap-3 rounded-2xl border px-4 py-4"
    >
      <span className="titulo text-2xl">{titulo}</span>
      {detalle ? <span className="text-tinta-suave text-sm">{detalle} →</span> : null}
    </Link>
  );
}

export async function Accesos() {
  await connection();
  // Sin conteos (Django caído), los accesos siguen sirviendo.
  const [autos, repuestos] = await Promise.all([
    obtenerArticulos({ tipo: "auto" })
      .then((p) => p.count)
      .catch(() => null),
    obtenerArticulos({ tipo: "repuesto" })
      .then((p) => p.count)
      .catch(() => null),
  ]);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Acceso
        href="/autos"
        titulo="Autos"
        detalle={autos === null ? null : `${autos} disponibles`}
      />
      <Acceso
        href="/repuestos"
        titulo="Repuestos"
        detalle={repuestos === null ? null : `${repuestos} en stock`}
      />
    </div>
  );
}
