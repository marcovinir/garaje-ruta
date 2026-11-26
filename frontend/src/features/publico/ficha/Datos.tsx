import type { FichaAuto, FichaRepuesto } from "@/shared/api/tipos";
import { miles } from "@/shared/lib/dinero";

type Fila = [string, string | null | undefined];

const ESTADO_GENERAL = {
  excelente: "Excelente",
  muy_bueno: "Muy bueno",
  bueno: "Bueno",
  regular: "Regular",
} as const;

const siNo = (v?: boolean | null) => (v == null ? null : v ? "Sí" : "No");
const numero = (v?: number | null) => (v == null ? null : miles(v));
const conUnidad = (v: number | null | undefined, unidad: string) =>
  v == null ? null : `${miles(v)} ${unidad}`;
const kwh = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 2 });

function marchamo(auto: FichaAuto) {
  const estado =
    auto.marchamo_al_dia == null ? null : auto.marchamo_al_dia ? "Al día" : "Pendiente";
  const anio = auto.marchamo_anio == null ? null : String(auto.marchamo_anio);
  return [estado, anio].filter(Boolean).join(" · ") || null;
}

function mesYAnio(fecha: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00Z`));
}

function Tabla({
  titulo,
  filas,
  mostrarVacios = false,
}: {
  titulo: string;
  filas: Fila[];
  mostrarVacios?: boolean;
}) {
  const visibles = filas.filter(([, valor]) => valor?.trim());
  if (!visibles.length) return null;
  return (
    <section aria-label={titulo} className="flex flex-col gap-3">
      <h2 className="titulo text-2xl">{titulo}</h2>
      <dl className="bg-tarjeta border-borde grid rounded-2xl border sm:grid-cols-2">
        {(mostrarVacios ? filas : visibles).map(([etiqueta, valor]) => (
          <div
            key={etiqueta}
            className="border-borde flex justify-between gap-4 border-b px-4 py-3 last:border-b-0"
          >
            <dt className="text-tinta-suave">{etiqueta}</dt>
            <dd className="min-w-0 text-right font-semibold break-words">
              {valor?.trim() || "Consultar"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ResumenAuto({ auto }: { auto: FichaAuto }) {
  const resumen = [
    conUnidad(auto.kilometraje, "km"),
    auto.transmision?.trim(),
    auto.combustible?.trim(),
  ].map((valor) => valor || "Consultar");
  return (
    <div className="text-tinta-suave flex flex-col gap-2 text-sm">
      <p>{resumen.join(" · ")}</p>
      <dl className="border-borde flex flex-col gap-1 border-t pt-2">
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt>Marchamo</dt>
          <dd className="text-tinta font-semibold">{marchamo(auto) ?? "Consultar"}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt>RTV vence</dt>
          <dd className="text-tinta font-semibold">
            {auto.riteve_vence ? mesYAnio(auto.riteve_vence) : "Consultar"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function DatosAuto({ auto }: { auto: FichaAuto }) {
  const tieneBateria =
    auto.combustible === "Eléctrico" || auto.combustible === "Híbrido enchufable";
  return (
    <>
      <Tabla
        titulo="Especificaciones técnicas"
        mostrarVacios
        filas={[
          ["Marca", auto.marca],
          ["Modelo", auto.modelo],
          ["Versión", auto.version],
          ["Año", auto.anio == null ? null : String(auto.anio)],
          ["Kilometraje", conUnidad(auto.kilometraje, "km")],
          ["Transmisión", auto.transmision],
          ["Combustible", auto.combustible],
          ["Tracción", auto.traccion],
          ["Carrocería", auto.carroceria],
          ["Motor", conUnidad(auto.cilindrada_cc, "cc")],
          ["Color exterior", auto.color_exterior],
          ["Color interior", auto.color_interior],
          ["Puertas", numero(auto.puertas)],
          ["Pasajeros", numero(auto.pasajeros)],
          ["Bolsas de aire", numero(auto.bolsas_aire)],
        ]}
      />
      {tieneBateria && (
        <Tabla
          titulo="Batería y carga"
          mostrarVacios
          filas={[
            ["Capacidad", auto.bateria_kwh == null ? null : `${kwh.format(auto.bateria_kwh)} kWh`],
            ["Salud de la batería (SOH)", conUnidad(auto.bateria_salud_pct, "%")],
            ["Autonomía", conUnidad(auto.autonomia_km, "km")],
            ["Tipo de carga", auto.tipo_carga],
          ]}
        />
      )}
      <Equipamiento grupos={auto.equipamiento} />
      <Tabla
        titulo="Estado y mantenimiento"
        mostrarVacios
        filas={[
          ["Estado general", ESTADO_GENERAL[auto.estado_general]],
          [
            "Procedencia",
            auto.procedencia === "agencia"
              ? "Agencia"
              : auto.procedencia === "importado"
                ? "Importado"
                : null,
          ],
          ["Único dueño", siNo(auto.unico_dueno)],
          ["Historial de mantenimiento", auto.historial_mantenimiento],
          ["Historial de accidentes", auto.historial_accidentes],
        ]}
      />
      <Tabla
        titulo="Documentación"
        mostrarVacios
        filas={[
          ["Marchamo", marchamo(auto)],
          ["RTV vence", auto.riteve_vence ? mesYAnio(auto.riteve_vence) : null],
          ["Impuestos pagados", siNo(auto.impuestos_pagados)],
          ["Sin gravámenes", siNo(auto.sin_gravamenes)],
          ["Traspaso incluido", siNo(auto.traspaso_incluido)],
          ["Placa termina en", numero(auto.placa_termina_en)],
        ]}
      />
      <Tabla
        titulo="Condiciones de compra"
        mostrarVacios
        filas={[
          ["Precio negociable", siNo(auto.precio_negociable)],
          ["Recibe vehículo", siNo(auto.acepta_vehiculo)],
          ["Financiamiento", siNo(auto.financiamiento)],
          ["Garantía", auto.garantia],
        ]}
      />
    </>
  );
}

function Equipamiento({ grupos }: { grupos: FichaAuto["equipamiento"] }) {
  const conDatos = grupos
    .map((grupo) => ({ ...grupo, items: grupo.items.filter((item) => item.trim()) }))
    .filter((grupo) => grupo.items.length);
  if (!conDatos.length) return null;
  return (
    <section aria-labelledby="equipamiento" className="flex flex-col gap-3">
      <h2 id="equipamiento" className="titulo text-2xl">
        Equipamiento
      </h2>
      <div className="bg-tarjeta border-borde grid gap-6 rounded-2xl border p-5 sm:grid-cols-2">
        {conDatos.map((g) => (
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
  const categoria = repuesto.categoria.padre
    ? `${repuesto.categoria.padre} › ${repuesto.categoria.nombre}`
    : repuesto.categoria.nombre;
  return (
    <>
      <Tabla
        titulo="Datos del repuesto"
        filas={[
          ["Categoría", categoria],
          ["Condición", repuesto.condicion === "nuevo" ? "Nuevo" : "Usado"],
          ["Disponibles", String(repuesto.cantidad)],
          ["Número de parte", repuesto.numero_parte || null],
        ]}
      />
      <section aria-labelledby="compatibilidad" className="flex flex-col gap-3">
        <h2 id="compatibilidad" className="titulo text-2xl">
          Compatible con
        </h2>
        {repuesto.compatibilidades.length ? (
          <ul className="bg-tarjeta border-borde divide-borde divide-y rounded-2xl border">
            {repuesto.compatibilidades.map((c) => (
              <li
                key={`${c.marca}-${c.modelo}-${c.anio_desde}`}
                className="flex justify-between gap-4 px-4 py-3"
              >
                <span className="font-semibold">
                  {c.marca} {c.modelo}
                </span>
                <span className="text-tinta-suave">
                  {c.anio_desde === c.anio_hasta ? c.anio_desde : `${c.anio_desde}–${c.anio_hasta}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-tinta-suave">
            Consultanos por WhatsApp para confirmar si le sirve a tu vehículo.
          </p>
        )}
      </section>
    </>
  );
}
