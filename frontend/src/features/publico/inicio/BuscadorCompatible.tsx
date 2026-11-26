"use client";

import { useState } from "react";

import type { Catalogos } from "@/shared/api/tipos";

import { FormularioGet } from "../filtros/FormularioGet";

const CAMPO =
  "bg-campo border-borde-campo min-h-11 w-full min-w-0 rounded-xl border px-3 disabled:opacity-70";

export function BuscadorCompatible({ marcas }: { marcas: Catalogos["marcas"] }) {
  const [marca, elegirMarca] = useState("");
  const modelos = marcas.find((m) => String(m.id) === marca)?.modelos ?? [];

  return (
    <section
      aria-labelledby="buscar-compatibles"
      className="bg-tarjeta border-borde rounded-2xl border p-4 sm:p-6"
    >
      <h2 id="buscar-compatibles" className="titulo mb-4 text-3xl sm:text-4xl">
        Buscá repuestos compatibles
      </h2>
      <FormularioGet
        action="/repuestos"
        aria-labelledby="buscar-compatibles"
        className="grid gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_0.65fr_auto] lg:items-end"
      >
        <div className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
          <label htmlFor="compatible-marca">Marca</label>
          <select
            id="compatible-marca"
            name="compatible_marca"
            className={CAMPO}
            required
            value={marca}
            onChange={(ev) => elegirMarca(ev.currentTarget.value)}
          >
            <option value="">Elegí una marca</option>
            {marcas
              .filter((m) => m.modelos.length)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
          <label htmlFor="compatible-modelo">Modelo</label>
          <select
            key={marca}
            id="compatible-modelo"
            name="compatible_modelo"
            className={CAMPO}
            required
            disabled={!modelos.length}
            defaultValue=""
          >
            <option value="">{marca ? "Elegí un modelo" : "Primero elegí la marca"}</option>
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
          <label htmlFor="compatible-anio">Año</label>
          <input
            id="compatible-anio"
            name="compatible_anio"
            type="number"
            inputMode="numeric"
            min={1950}
            max={9999}
            placeholder="Ej.: 2018"
            className={CAMPO}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-rojo hover:bg-rojo-fuerte min-h-11 rounded-xl px-4 py-2 text-sm font-bold text-white sm:col-span-3 lg:col-span-1"
        >
          Buscar repuestos compatibles
        </button>
      </FormularioGet>
    </section>
  );
}
