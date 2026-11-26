import {
  type AutoWhatsapp,
  type RepuestoWhatsapp,
  enlaceConsultaAuto,
  enlaceVisitaAuto,
  enlaceConsultaRepuesto,
  enlaceCompatibilidadRepuesto,
} from "@/shared/lib/whatsapp";
import { BotonWhatsapp } from "./BotonWhatsapp";

type Props = (
  | { tipo: "auto"; datos: AutoWhatsapp }
  | { tipo: "repuesto"; datos: RepuestoWhatsapp; soloCompatibilidad?: boolean }
) & { numero: string; compacto?: boolean };

/** Acciones listas para reutilizar cuando cambie la composición de las fichas. */
export function BotonesWhatsappFicha(props: Props) {
  const consulta =
    props.tipo === "auto"
      ? enlaceConsultaAuto(props.numero, props.datos)
      : enlaceConsultaRepuesto(props.numero, props.datos);
  if (props.compacto)
    return <BotonWhatsapp enlace={consulta} texto="Consultar" className="flex-1" />;
  const secundario =
    props.tipo === "auto"
      ? enlaceVisitaAuto(props.numero, props.datos)
      : enlaceCompatibilidadRepuesto(props.numero, props.datos);
  const botonSecundario = (
    <BotonWhatsapp
      enlace={secundario}
      texto={props.tipo === "auto" ? "Agendar una visita" : "Confirmar compatibilidad"}
      secundario
    />
  );
  if (props.tipo === "repuesto" && props.soloCompatibilidad) return botonSecundario;
  return (
    <div className="flex flex-col gap-3">
      <BotonWhatsapp enlace={consulta} />
      {botonSecundario}
    </div>
  );
}
