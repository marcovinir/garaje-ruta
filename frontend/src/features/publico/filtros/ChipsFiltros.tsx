import Link from "next/link";

import type { Catalogos, CategoriaApi } from "@/shared/api/tipos";
import { colones, miles } from "@/shared/lib/dinero";

import { type Filtros, NO_SON_FILTROS, aQueryString, hrefSin } from "./filtrosDesdeUrl";

type Chip = { etiqueta: string; href: string };

function buscarCategoria(arbol: CategoriaApi[], slug: string): CategoriaApi | undefined {
  for (const c of arbol) {
    if (c.slug === slug) return c;
    const hija = buscarCategoria(c.hijas, slug);
    if (hija) return hija;
  }
  return undefined;
}

function etiqueta(clave: string, valor: string, c: Catalogos): string {
  const id = Number(valor);
  const nombre = (lista: { id: number; nombre: string }[]) =>
    lista.find((x) => x.id === id)?.nombre;
  const modelos = c.marcas.flatMap((m) => m.modelos);
  switch (clave) {
    case "q":
      return `«${valor}»`;
    case "marca":
      return nombre(c.marcas) ?? "Marca";
    case "modelo":
      return nombre(modelos) ?? "Modelo";
    case "anio_min":
      return `Desde ${valor}`;
    case "anio_max":
      return `Hasta ${valor}`;
    case "precio_min":
      return `Desde ${colones(id)}`;
    case "precio_max":
      return `Hasta ${colones(id)}`;
    case "km_max":
      return `Hasta ${miles(id)} km`;
    case "transmision":
      return nombre(c.transmisiones) ?? "Transmisión";
    case "combustible":
      return nombre(c.combustibles) ?? "Combustible";
    case "traccion":
      return nombre(c.tracciones) ?? "Tracción";
    case "carroceria":
      return c.carrocerias.find((x) => x.slug === valor)?.nombre ?? valor;
    case "ofertas":
      return "En oferta";
    case "categoria":
      return buscarCategoria(c.categorias, valor)?.nombre ?? valor;
    case "condicion":
      return valor === "nuevo" ? "Nuevo" : "Usado";
    case "compatible_marca":
      return `Para ${nombre(c.marcas) ?? "esa marca"}`;
    case "compatible_modelo":
      return `Para ${nombre(modelos) ?? "ese modelo"}`;
    case "compatible_anio":
      return `Año ${valor}`;
    default:
      return valor;
  }
}

export function chipsDe(base: string, filtros: Filtros, catalogos: Catalogos): Chip[] {
  const equipamiento = catalogos.equipamiento.flatMap((g) => g.items);
  return Object.entries(filtros).flatMap(([clave, valor]): Chip[] => {
    if (NO_SON_FILTROS.has(clave)) return [];
    if (clave === "equipamiento") {
      return valor.split(",").map((id) => ({
        etiqueta: equipamiento.find((e) => String(e.id) === id)?.nombre ?? "Equipamiento",
        href: hrefSin(base, filtros, clave, id),
      }));
    }
    return [{ etiqueta: etiqueta(clave, valor, catalogos), href: hrefSin(base, filtros, clave) }];
  });
}

type Props = { base: string; filtros: Filtros; catalogos: Catalogos };

export function ChipsFiltros({ base, filtros, catalogos }: Props) {
  const chips = chipsDe(base, filtros, catalogos);
  if (!chips.length) return null;
  const limpio = filtros.orden ? aQueryString({ orden: filtros.orden }) : "";
  return (
    <ul aria-label="Filtros aplicados" className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.href}>
          <Link
            href={chip.href}
            aria-label={`Quitar filtro ${chip.etiqueta}`}
            className="bg-rojo-suave text-rojo-oscuro hover:bg-rojo inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold hover:text-white"
          >
            {chip.etiqueta}
            <span aria-hidden="true">×</span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={`${base}${limpio}`}
          className="text-tinta-suave hover:text-tinta inline-flex min-h-11 items-center px-2 text-sm font-semibold underline underline-offset-4"
        >
          Limpiar filtros
        </Link>
      </li>
    </ul>
  );
}
