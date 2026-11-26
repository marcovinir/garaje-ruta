import type { CondicionesComerciales, FichaRepuesto } from "@/shared/api/tipos";

const CLASIFICACIONES = { original: "Original", oem: "OEM", generico: "Genérico" } as const;

export function condicionRepuesto(condicion: FichaRepuesto["condicion"]) {
  if (condicion === "nuevo") return "Nuevo";
  if (condicion === "usado") return "Usado";
  return "Consultar";
}

export function resumenRepuesto(repuesto: FichaRepuesto) {
  const cantidad = repuesto.cantidad;
  const stock =
    cantidad == null
      ? "Consultar"
      : cantidad === 0
        ? "Agotado"
        : cantidad === 1
          ? "Queda 1"
          : `Quedan ${cantidad}`;
  return `${condicionRepuesto(repuesto.condicion)} · ${stock}`;
}

export function IdentificacionRepuesto({ repuesto }: { repuesto: FichaRepuesto }) {
  const filas = [
    ["Número de parte", repuesto.numero_parte],
    ["Fabricante", repuesto.fabricante],
    ["Clasificación", repuesto.clasificacion ? CLASIFICACIONES[repuesto.clasificacion] : null],
  ];
  if (!filas.some(([, valor]) => valor?.trim())) return null;
  return (
    <dl className="border-borde flex flex-col gap-1 border-t pt-2 text-sm">
      {filas.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-tinta-suave">{etiqueta}</dt>
          <dd className="min-w-0 font-semibold break-words">{valor?.trim() || "Consultar"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CondicionesRepuesto({ configuracion }: { configuracion: CondicionesComerciales }) {
  const textos = [
    ["Garantía", configuracion.garantia_repuestos],
    ["Devoluciones", configuracion.condiciones_devolucion],
    ["Entrega", configuracion.metodos_entrega],
  ];
  if (!textos.some(([, valor]) => valor?.trim())) return null;
  return (
    <section aria-labelledby="condiciones-repuesto" className="flex flex-col gap-3">
      <h2 id="condiciones-repuesto" className="titulo text-2xl">
        Garantía, devoluciones y entrega
      </h2>
      <dl className="bg-tarjeta border-borde divide-borde divide-y rounded-2xl border">
        {textos.map(([etiqueta, texto]) => (
          <div key={etiqueta} className="flex flex-col gap-1 px-4 py-3">
            <dt className="font-semibold">{etiqueta}</dt>
            <dd className="text-tinta-suave break-words whitespace-pre-line">
              {texto?.trim() || "Consultar"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
