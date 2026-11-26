import { condicionRepuesto } from "./datosComercialesRepuesto";

import type { FichaAuto, FichaRepuesto } from "@/shared/api/tipos";
import { miles } from "@/shared/lib/dinero";

type Fila = [string, string | null];

const ESTADO_GENERAL = {
  excelente: "Excelente",
  muy_bueno: "Muy bueno",
  bueno: "Bueno",
  regular: "Regular",
} as const;

const siNo = (v: boolean) => (v ? "Sí" : "No");

function mesYAnio(fecha: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

function Tabla({ titulo, filas }: { titulo: string; filas: Fila[] }) {
  const visibles = filas.filter((f): f is [string, string] => Boolean(f[1]));
  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <h2 className="titulo text-2xl">{titulo}</h2>
      <dl className="bg-tarjeta border-borde grid rounded-2xl border sm:grid-cols-2">
        {visibles.map(([etiqueta, valor]) => (
          <div
            key={etiqueta}
            className="border-borde flex justify-between gap-4 border-b px-4 py-3 last:border-b-0"
          >
            <dt className="text-tinta-suave">{etiqueta}</dt>
            <dd className="text-right font-semibold">{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DatosAuto({ auto }: { auto: FichaAuto }) {
  return (
    <>
      <Tabla
        titulo="Ficha técnica"
        filas={[
          ["Marca", auto.marca],
          ["Modelo", auto.modelo],
          ["Versión", auto.version || null],
          ["Año", String(auto.anio)],
          ["Kilometraje", `${miles(auto.kilometraje)} km`],
          ["Transmisión", auto.transmision],
          ["Combustible", auto.combustible],
          ["Tracción", auto.traccion],
          ["Carrocería", auto.carroceria],
          ["Motor", auto.cilindrada_cc ? `${miles(auto.cilindrada_cc)} cc` : null],
          ["Color exterior", auto.color_exterior],
          ["Color interior", auto.color_interior],
          ["Puertas", String(auto.puertas)],
          ["Pasajeros", String(auto.pasajeros)],
          ["Bolsas de aire", String(auto.bolsas_aire)],
        ]}
      />
      <Tabla
        titulo="Papeles y condiciones"
        filas={[
          ["Estado general", ESTADO_GENERAL[auto.estado_general]],
          ["Procedencia", auto.procedencia === "agencia" ? "Agencia" : "Importado"],
          ["Único dueño", siNo(auto.unico_dueno)],
          ["Marchamo al día", siNo(auto.marchamo_al_dia)],
          ["RTV vence", auto.riteve_vence ? mesYAnio(auto.riteve_vence) : null],
          ["Impuestos pagados", siNo(auto.impuestos_pagados)],
          [
            "Placa termina en",
            auto.placa_termina_en === null ? null : String(auto.placa_termina_en),
          ],
          ["Recibe vehículo", siNo(auto.acepta_vehiculo)],
          ["Precio negociable", siNo(auto.precio_negociable)],
        ]}
      />
    </>
  );
}

export function Equipamiento({ grupos }: { grupos: FichaAuto["equipamiento"] }) {
  if (!grupos.length) return null;
  return (
    <section aria-labelledby="equipamiento" className="flex flex-col gap-3">
      <h2 id="equipamiento" className="titulo text-2xl">
        Equipamiento
      </h2>
      <div className="bg-tarjeta border-borde grid gap-6 rounded-2xl border p-5 sm:grid-cols-2">
        {grupos.map((g) => (
          <div key={g.grupo} className="flex flex-col gap-2">
            <h3 className="font-bold">{g.grupo}</h3>
            <ul className="flex flex-col gap-1.5">
              {g.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="text-disponible-tinta mt-0.5 size-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DatosRepuesto({ repuesto }: { repuesto: FichaRepuesto }) {
  const categoria = [repuesto.categoria.padre, repuesto.categoria.nombre]
    .filter((nombre) => nombre?.trim())
    .join(" › ");
  const conMotor = repuesto.compatibilidades.some((c) => c.motor_version?.trim());
  return (
    <>
      <Tabla
        titulo="Estado de la pieza"
        filas={[
          ["Condición", condicionRepuesto(repuesto.condicion)],
          ["Categoría", categoria || "Consultar"],
        ]}
      />
      {repuesto.compatibilidades.length > 0 && (
        <section aria-labelledby="compatibilidad" className="flex flex-col gap-3">
          <h2 id="compatibilidad" className="titulo text-2xl">
            Compatibilidad
          </h2>
          <div className="bg-tarjeta border-borde overflow-hidden rounded-2xl border">
            <table
              aria-labelledby="compatibilidad"
              className="w-full table-fixed text-left text-sm"
            >
              <thead className="bg-campo">
                <tr>
                  {[
                    "Marca",
                    "Modelo",
                    "Año inicial",
                    "Año final",
                    ...(conMotor ? ["Motor o versión"] : []),
                  ].map((titulo) => (
                    <th
                      key={titulo}
                      scope="col"
                      className="px-2 py-3 align-top break-words sm:px-3"
                    >
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-borde divide-y">
                {repuesto.compatibilidades.map((c, indice) => (
                  <tr key={indice}>
                    {[
                      c.marca?.trim() || "Consultar",
                      c.modelo?.trim() || "Consultar",
                      c.anio_desde ?? "Consultar",
                      c.anio_hasta ?? "Consultar",
                      ...(conMotor ? [c.motor_version?.trim() || "Consultar"] : []),
                    ].map((valor, columna) => (
                      <td key={columna} className="px-2 py-3 align-top break-words sm:px-3">
                        {valor}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
