import { colones, dolares } from "@/shared/lib/dinero";

type Props = {
  colones: number;
  dolares: number | null;
  anterior?: number | null;
  tamano?: "tarjeta" | "ficha";
};

/** Precio en colones grande; «Antes» tachado arriba y el dólar debajo, pequeño (decisión de Marco). */
export function Precio({ colones: monto, dolares: usd, anterior, tamano = "tarjeta" }: Props) {
  const grande = tamano === "ficha" ? "text-5xl" : "text-[1.7rem]";
  return (
    <div className="flex flex-col">
      {anterior ? (
        <span className="text-tinta-suave text-sm line-through">Antes {colones(anterior)}</span>
      ) : null}
      <span className={`titulo ${grande} leading-none ${anterior ? "text-rojo" : "text-tinta"}`}>
        {colones(monto)}
      </span>
      {usd !== null ? <span className="text-tinta-suave mt-1 text-sm">{dolares(usd)}</span> : null}
    </div>
  );
}
