import Link from "next/link";
import type { ReactNode } from "react";

import type { Catalogos, CategoriaApi } from "@/shared/api/tipos";
import { miles } from "@/shared/lib/dinero";

import { FormularioGet } from "./FormularioGet";
import { type Filtros, type TipoListado, aQueryString } from "./filtrosDesdeUrl";

const CAMPO =
  "bg-campo border-borde-campo text-tinta min-h-11 w-full rounded-xl border px-3 focus-visible:border-rojo";
const ETIQUETA = "text-sm font-semibold";
const KILOMETRAJES = [30000, 60000, 100000, 150000, 200000];

type Base = { id: string; filtros: Filtros };

function Campo({
  etiqueta,
  htmlFor,
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={ETIQUETA}>
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

function Seleccion({
  id,
  filtros,
  nombre,
  etiqueta,
  opciones,
  todas = "Todas",
}: Base & {
  nombre: string;
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  todas?: string;
}) {
  return (
    <Campo etiqueta={etiqueta} htmlFor={`${id}-${nombre}`}>
      <select
        id={`${id}-${nombre}`}
        name={nombre}
        defaultValue={filtros[nombre] ?? ""}
        className={CAMPO}
      >
        <option value="">{todas}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </Campo>
  );
}

/** Modelos agrupados por marca: sin JavaScript no se puede filtrar el segundo select. */
function SeleccionModelo({
  id,
  filtros,
  nombre,
  catalogos,
}: Base & { nombre: string; catalogos: Catalogos }) {
  return (
    <Campo etiqueta="Modelo" htmlFor={`${id}-${nombre}`}>
      <select
        id={`${id}-${nombre}`}
        name={nombre}
        defaultValue={filtros[nombre] ?? ""}
        className={CAMPO}
      >
        <option value="">Todos</option>
        {catalogos.marcas
          .filter((m) => m.modelos.length)
          .map((m) => (
            <optgroup key={m.id} label={m.nombre}>
              {m.modelos.map((mo) => (
                <option key={mo.id} value={mo.id}>
                  {mo.nombre}
                </option>
              ))}
            </optgroup>
          ))}
      </select>
    </Campo>
  );
}

function Numero({
  id,
  filtros,
  nombre,
  etiqueta,
  ...resto
}: Base & {
  nombre: string;
  etiqueta: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <Campo etiqueta={etiqueta} htmlFor={`${id}-${nombre}`}>
      <input
        id={`${id}-${nombre}`}
        name={nombre}
        type="number"
        inputMode="numeric"
        defaultValue={filtros[nombre] ?? ""}
        className={CAMPO}
        {...resto}
      />
    </Campo>
  );
}

function Casilla({
  id,
  nombre,
  valor,
  texto,
  marcada,
}: {
  id: string;
  nombre: string;
  valor: string;
  texto: string;
  marcada: boolean;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        name={nombre}
        value={valor}
        defaultChecked={marcada}
        className="accent-rojo size-5"
      />
      <span>{texto}</span>
    </label>
  );
}

function aplanar(categorias: CategoriaApi[], nivel = 0): { valor: string; texto: string }[] {
  return categorias.flatMap((c) => [
    { valor: c.slug, texto: `${"— ".repeat(nivel)}${c.nombre}` },
    ...aplanar(c.hijas, nivel + 1),
  ]);
}

function CamposAuto({ id, filtros, catalogos }: Base & { catalogos: Catalogos }) {
  const equipamiento = catalogos.equipamiento.flatMap((g) => g.items.filter((i) => i.filtrable));
  const elegidos = new Set((filtros.equipamiento ?? "").split(","));
  const base = { id, filtros };
  return (
    <>
      <Seleccion
        {...base}
        nombre="marca"
        etiqueta="Marca"
        opciones={catalogos.marcas.map((m) => ({ valor: String(m.id), texto: m.nombre }))}
      />
      <SeleccionModelo {...base} nombre="modelo" catalogos={catalogos} />
      <Seleccion
        {...base}
        nombre="carroceria"
        etiqueta="Carrocería"
        opciones={catalogos.carrocerias.map((c) => ({ valor: c.slug, texto: c.nombre }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Numero {...base} nombre="anio_min" etiqueta="Año desde" min={1950} />
        <Numero {...base} nombre="anio_max" etiqueta="Año hasta" min={1950} />
      </div>
      <Precios {...base} />
      <Seleccion
        {...base}
        nombre="transmision"
        etiqueta="Transmisión"
        opciones={catalogos.transmisiones.map((t) => ({ valor: String(t.id), texto: t.nombre }))}
      />
      <details
        open={["km_max", "combustible", "traccion", "equipamiento", "ofertas"].some((clave) =>
          Boolean(filtros[clave]),
        )}
        className="border-borde rounded-xl border px-3"
      >
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">Más filtros</summary>
        <div className="flex flex-col gap-4 pb-3">
          <Seleccion
            {...base}
            nombre="km_max"
            etiqueta="Kilometraje máximo"
            todas="Cualquiera"
            opciones={KILOMETRAJES.map((km) => ({ valor: String(km), texto: `${miles(km)} km` }))}
          />
          <Seleccion
            {...base}
            nombre="combustible"
            etiqueta="Combustible"
            opciones={catalogos.combustibles.map((t) => ({ valor: String(t.id), texto: t.nombre }))}
          />
          <Seleccion
            {...base}
            nombre="traccion"
            etiqueta="Tracción"
            opciones={catalogos.tracciones.map((t) => ({ valor: String(t.id), texto: t.nombre }))}
          />
          {equipamiento.length ? (
            <fieldset className="flex flex-col">
              <legend className={`${ETIQUETA} mb-1`}>Equipamiento</legend>
              {equipamiento.map((e) => (
                <Casilla
                  key={e.id}
                  id={`${id}-equipamiento-${e.id}`}
                  nombre="equipamiento"
                  valor={String(e.id)}
                  texto={e.nombre}
                  marcada={elegidos.has(String(e.id))}
                />
              ))}
            </fieldset>
          ) : null}
          <SoloOfertas {...base} />
        </div>
      </details>
    </>
  );
}

function CamposRepuesto({ id, filtros, catalogos }: Base & { catalogos: Catalogos }) {
  const base = { id, filtros };
  return (
    <>
      <fieldset className="border-borde flex flex-col gap-4 rounded-2xl border p-4">
        <legend className={`${ETIQUETA} px-1`}>Buscar por vehículo</legend>
        <Seleccion
          {...base}
          nombre="compatible_marca"
          etiqueta="Marca del vehículo"
          opciones={catalogos.marcas.map((m) => ({ valor: String(m.id), texto: m.nombre }))}
        />
        <SeleccionModelo {...base} nombre="compatible_modelo" catalogos={catalogos} />
        <Numero
          {...base}
          nombre="compatible_anio"
          etiqueta="Año"
          min={1950}
          placeholder="Ej.: 2012"
        />
      </fieldset>
      <Seleccion
        {...base}
        nombre="categoria"
        etiqueta="Categoría"
        opciones={aplanar(catalogos.categorias)}
      />
      <Seleccion
        {...base}
        nombre="condicion"
        etiqueta="Condición"
        todas="Nuevos y usados"
        opciones={[
          { valor: "nuevo", texto: "Nuevo" },
          { valor: "usado", texto: "Usado" },
        ]}
      />
    </>
  );
}

function Precios(base: Base) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Numero {...base} nombre="precio_min" etiqueta="Precio desde (₡)" min={0} />
      <Numero {...base} nombre="precio_max" etiqueta="Precio hasta (₡)" min={0} />
    </div>
  );
}

function SoloOfertas({ id, filtros }: Base) {
  return (
    <Casilla
      id={`${id}-ofertas`}
      nombre="ofertas"
      valor="1"
      texto="Solo ofertas"
      marcada={filtros.ofertas === "1"}
    />
  );
}

type Props = { tipo: TipoListado; id: string; filtros: Filtros; catalogos: Catalogos };

export function PanelFiltros({ tipo, id, filtros, catalogos }: Props) {
  const base = tipo === "auto" ? "/autos" : "/repuestos";
  const conservar = filtros.orden ? aQueryString({ orden: filtros.orden }) : "";
  return (
    <FormularioGet
      // Al navegar con otros filtros el formulario se monta de nuevo con los valores de la URL.
      key={aQueryString(filtros)}
      action={base}
      seccionEvento="filtros"
      aria-label="Filtros"
      className="flex flex-col gap-4"
    >
      {filtros.orden ? <input type="hidden" name="orden" value={filtros.orden} /> : null}
      {filtros.q ? <input type="hidden" name="q" value={filtros.q} /> : null}
      {tipo === "auto" ? (
        <CamposAuto id={id} filtros={filtros} catalogos={catalogos} />
      ) : (
        <CamposRepuesto id={id} filtros={filtros} catalogos={catalogos} />
      )}
      {tipo === "repuesto" ? (
        <>
          <Precios {...{ id, filtros }} />
          <SoloOfertas {...{ id, filtros }} />
        </>
      ) : null}
      <div className="bg-tarjeta sticky bottom-0 flex gap-3 py-2">
        <button
          type="submit"
          className="bg-rojo hover:bg-rojo-fuerte min-h-11 flex-1 rounded-xl px-4 font-semibold text-white"
        >
          Aplicar filtros
        </button>
        <Link
          href={`${base}${conservar}`}
          className="border-borde inline-flex min-h-11 items-center rounded-xl border px-4 font-semibold"
        >
          Limpiar
        </Link>
      </div>
    </FormularioGet>
  );
}
