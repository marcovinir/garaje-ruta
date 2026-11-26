"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EtiquetaEstado } from "@/features/publico/componentes/EtiquetaEstado";
import { api } from "@/shared/api/navegador";
import { colones, miles } from "@/shared/lib/dinero";

import { useSesion } from "../auth/useSesion";
import { RequierePermiso } from "../estructura/RequierePermiso";
import { rutaPanel } from "../rutaPanel";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_SECUNDARIO, CAMPO, TARJETA } from "../ui/estilos";
import { type Rango, RANGO_PREDETERMINADO, RANGOS, fechasDelRango } from "./rango";

type Venta = { cantidad: number; monto: number };
type VentaMes = { mes: string; auto: Venta; repuesto: Venta };
type Articulo = {
  id: number;
  titulo: string;
  ruta: string;
  tipo: "auto" | "repuesto";
  estado: "disponible" | "reservado" | "vendido" | "oculto" | "agotado";
  total: number;
};

type Reporte = {
  desde: string;
  hasta: string;
  ventas: Venta & { dias_promedio: number | null };
  ventas_por_mes: VentaMes[];
  interes: { consultas: number; visitas: number; compatibilidad: number };
  mas_vistos: Articulo[];
  mas_consultados: Articulo[];
};

const MES = new Intl.DateTimeFormat("es-CR", { month: "short", year: "numeric", timeZone: "UTC" });
const DIA = new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeZone: "UTC" });
const DECIMAL = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 });

function ventasMensuales(meses: VentaMes[]) {
  const mayor = Math.max(1, ...meses.map(({ auto, repuesto }) => auto.monto + repuesto.monto));
  return (
    <section
      aria-labelledby="ventas-mes"
      className={TARJETA + " flex min-w-0 flex-col gap-4 p-4 sm:p-5"}
    >
      <h2 id="ventas-mes" className="titulo text-2xl">
        Ventas por mes
      </h2>
      {!meses.length ? (
        <p>No hay ventas en este rango.</p>
      ) : (
        <>
          <div aria-hidden="true" className="flex flex-col gap-2 text-sm">
            <p className="flex flex-wrap gap-4">
              <span className="flex items-center gap-2">
                <span className="bg-rojo size-3 rounded-sm" /> Autos
              </span>
              <span className="flex items-center gap-2">
                <span className="bg-tinta-suave size-3 rounded-sm" /> Repuestos
              </span>
            </p>
            {meses.map(({ mes, auto, repuesto }) => (
              <div key={mes} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2">
                <span>{MES.format(new Date(mes + "-01"))}</span>
                <div className="bg-campo flex h-5 overflow-hidden rounded">
                  <span className="bg-rojo" style={{ width: (auto.monto / mayor) * 100 + "%" }} />
                  <span
                    className="bg-tinta-suave"
                    style={{ width: (repuesto.monto / mayor) * 100 + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table aria-labelledby="ventas-mes" className="w-full text-sm">
              <thead className="bg-campo">
                <tr>
                  <th scope="col" className="p-2 text-left">
                    Mes
                  </th>
                  <th scope="col" className="p-2 text-right">
                    Autos
                  </th>
                  <th scope="col" className="p-2 text-right">
                    Repuestos
                  </th>
                </tr>
              </thead>
              <tbody>
                {meses.map(({ mes, auto, repuesto }) => (
                  <tr key={mes} className="border-borde border-t text-right">
                    <th scope="row" className="p-2 text-left font-semibold">
                      {MES.format(new Date(mes + "-01"))}
                    </th>
                    {[auto, repuesto].map(({ cantidad, monto }, i) => (
                      <td className="p-2" key={i}>
                        <span className="block font-semibold">{colones(monto)}</span>
                        <span className="text-tinta-suave">
                          {miles(cantidad)} {cantidad === 1 ? "unidad" : "unidades"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Ranking({
  titulo,
  filas,
  columna,
}: {
  titulo: string;
  filas: Articulo[];
  columna: "Vistas" | "Consultas";
}) {
  const { puede } = useSesion();
  return (
    <section className={TARJETA + " flex min-w-0 flex-col gap-3 p-4 sm:p-5"}>
      <h2 className="titulo text-2xl">{titulo}</h2>
      {!filas.length ? (
        <p>Todavía no hay datos en este rango.</p>
      ) : (
        <table aria-label={titulo} className="w-full text-sm">
          <thead className="bg-campo text-left">
            <tr>
              <th scope="col" className="p-2">
                Artículo
              </th>
              <th scope="col" className="p-2">
                Estado
              </th>
              <th scope="col" className="p-2 text-right">
                {columna}
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.id} className="border-borde border-t">
                <td className="p-2 [overflow-wrap:anywhere]">
                  {fila.estado === "oculto" && !puede("articulos.editar") ? (
                    fila.titulo
                  ) : (
                    <Link
                      href={
                        puede("articulos.editar") ? rutaPanel("articulos/" + fila.id) : fila.ruta
                      }
                      className="text-rojo-oscuro font-semibold underline underline-offset-4"
                    >
                      {fila.titulo}
                    </Link>
                  )}
                  <p className="text-tinta-suave">{fila.tipo === "auto" ? "Auto" : "Repuesto"}</p>
                </td>
                <td className="p-2">
                  <EtiquetaEstado estado={fila.estado} />
                </td>
                <td className="p-2 text-right">{miles(fila.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Resultados({ datos }: { datos: Reporte }) {
  const { ventas, interes } = datos;
  return (
    <>
      <p className="text-tinta-suave">
        {DIA.format(new Date(datos.desde))} al {DIA.format(new Date(datos.hasta))}
      </p>
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Unidades vendidas", miles(ventas.cantidad)],
          ["Monto vendido", colones(ventas.monto)],
          [
            "Días promedio en venta",
            ventas.dias_promedio === null ? "Sin datos" : DECIMAL.format(ventas.dias_promedio),
          ],
          ["Consultas por WhatsApp", miles(interes.consultas)],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className={TARJETA + " min-w-0 p-3 sm:p-4"}>
            <dt className="text-tinta-suave text-sm font-semibold">{etiqueta}</dt>
            <dd className="titulo text-2xl break-words sm:text-3xl">{valor}</dd>
          </div>
        ))}
      </dl>
      {ventasMensuales(datos.ventas_por_mes)}
      <div className="grid gap-4 xl:grid-cols-2">
        <Ranking titulo="Más vistos" filas={datos.mas_vistos} columna="Vistas" />
        <Ranking
          titulo="Más consultados por WhatsApp"
          filas={datos.mas_consultados}
          columna="Consultas"
        />
      </div>
      <dl className={TARJETA + " grid grid-cols-2 gap-3 p-4"}>
        <div>
          <dt>Pedidos de visita</dt>
          <dd className="titulo text-2xl">{miles(interes.visitas)}</dd>
        </div>
        <div>
          <dt>Consultas de compatibilidad</dt>
          <dd className="titulo text-2xl">{miles(interes.compatibilidad)}</dd>
        </div>
      </dl>
    </>
  );
}

function Contenido() {
  const params = useSearchParams();
  const router = useRouter();
  const crudo = params.get("rango");
  const rango = crudo && Object.hasOwn(RANGOS, crudo) ? (crudo as Rango) : RANGO_PREDETERMINADO;
  const fechas = fechasDelRango(rango);
  const reporte = useQuery({
    queryKey: ["panel", "reportes", fechas],
    queryFn: () => api<Reporte>("/panel/reportes/", { query: fechas }),
  });

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPagina
        titulo="Reportes"
        descripcion="Ventas, tiempo en venta e interés en el catálogo."
        acciones={
          <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold">
            Rango
            <select
              className={CAMPO}
              value={rango}
              onChange={(e) => router.replace(rutaPanel("reportes?rango=" + e.currentTarget.value))}
            >
              {Object.entries(RANGOS).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </label>
        }
      />
      {reporte.isError ? (
        <div className={TARJETA + " flex flex-col items-start gap-3 p-5"}>
          <p role="alert">No pudimos cargar los reportes.</p>
          <button className={BOTON_SECUNDARIO} type="button" onClick={() => reporte.refetch()}>
            Reintentar
          </button>
        </div>
      ) : !reporte.data ? (
        <div aria-busy="true" role="status" className="bg-campo h-40 animate-pulse rounded-2xl">
          <span className="sr-only">Cargando reportes</span>
        </div>
      ) : (
        <Resultados datos={reporte.data} />
      )}
    </div>
  );
}

export function PaginaReportes() {
  return (
    <RequierePermiso codigo="reportes.ver">
      <Contenido />
    </RequierePermiso>
  );
}
