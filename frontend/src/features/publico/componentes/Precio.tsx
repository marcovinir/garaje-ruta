import { colones, dolares } from "@/shared/lib/dinero";

type Props = {
  colones: number;
  dolares: number | null;
  anterior?: number | null;
  tamano?: "tarjeta" | "ficha";
  mostrarAhorro?: boolean;
  alinearTarjeta?: boolean;
};

/** Precio en colones grande; «Antes» tachado arriba y el dólar debajo, pequeño (decisión de Marco). */
export function Precio({
  colones: monto,
  dolares: usd,
  anterior,
  tamano = "tarjeta",
  mostrarAhorro = false,
  alinearTarjeta = false,
}: Props) {
  const ahorro = mostrarAhorro && anterior != null ? anterior - monto : 0;
  const grande = tamano === "ficha" ? "text-5xl" : "text-[1.7rem]";
  return (
    <div
      className={alinearTarjeta ? "grid grid-rows-[1.25rem_auto_1.5rem_1.75rem]" : "flex flex-col"}
    >
      {anterior ? (
        <span className="text-tinta-suave text-sm line-through">Antes {colones(anterior)}</span>
      ) : null}
      <span
        className={`titulo row-start-2 ${grande} leading-none ${anterior ? "text-rojo" : "text-tinta"}`}
      >
        {colones(monto)}
      </span>
      {usd !== null ? (
        <span className="text-tinta-suave row-start-3 mt-1 text-sm">{dolares(usd)}</span>
      ) : null}
      {ahorro > 0 && (
        <span className="text-disponible-tinta row-start-4 mt-2 text-sm font-semibold">
          Ahorrás {colones(ahorro)}
        </span>
      )}
    </div>
  );
}
