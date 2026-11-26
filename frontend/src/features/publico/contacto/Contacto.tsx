import type { ReactNode } from "react";

import type { Configuracion } from "@/shared/api/tipos";
import { esUrlWeb } from "@/shared/lib/urlWeb";
import { enlaceWhatsappGeneral } from "@/shared/lib/whatsapp";

import { IconoWhatsapp } from "../componentes/BotonWhatsapp";
import { resumirHorarios } from "../componentes/PieDePagina";

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="bg-tarjeta border-borde flex min-w-0 flex-col gap-3 rounded-2xl border p-5 sm:p-6">
      <h2 className="titulo text-2xl">{titulo}</h2>
      {children}
    </section>
  );
}

const enlace =
  "text-rojo-oscuro inline-flex min-h-11 items-center self-start font-semibold underline underline-offset-4";

export function Contacto({ configuracion }: { configuracion: Configuracion | null }) {
  const nombre = configuracion?.nombre.trim() || "Garaje Ruta";
  const direccion = configuracion?.direccion.trim();
  const mapa = configuracion?.mapa_url.trim();
  const whatsapp = configuracion?.whatsapp.trim();
  const horarios = resumirHorarios(configuracion?.horarios ?? []);
  const preguntas = (configuracion?.preguntas_frecuentes ?? []).filter(
    (fila) => fila.pregunta.trim() && fila.respuesta.trim(),
  );
  const redes = (configuracion?.redes_sociales ?? []).filter(
    ({ red, url }) => red.trim() && esUrlWeb(url.trim()),
  );
  const condiciones = [
    ["Métodos de pago", configuracion?.metodos_pago],
    ["Condiciones de compra", configuracion?.condiciones_compra],
    ["Métodos de entrega", configuracion?.metodos_entrega],
    ["Garantía de repuestos", configuracion?.garantia_repuestos],
    ["Devoluciones", configuracion?.condiciones_devolucion],
  ] as const;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="titulo text-4xl sm:text-5xl">Contacto y confianza</h1>
        <p className="bg-rojo-suave text-rojo-oscuro rounded-xl px-4 py-3 text-sm font-semibold">
          Negocio ficticio de portafolio. Los datos del sitio son de ejemplo.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bloque titulo="Ubicación">
          <p>Heredia, Costa Rica</p>
          {direccion && direccion.toLocaleLowerCase("es-CR") !== "heredia, costa rica" && (
            <p className="text-tinta-suave break-words">{direccion}</p>
          )}
          {mapa && esUrlWeb(mapa) && (
            <a href={mapa} target="_blank" rel="noopener noreferrer" className={enlace}>
              Cómo llegar
            </a>
          )}
        </Bloque>
        {horarios.length > 0 && (
          <Bloque titulo="Horario">
            <ul className="text-tinta-suave flex flex-col gap-1">
              {horarios.map((horario) => (
                <li key={horario}>{horario}</li>
              ))}
            </ul>
          </Bloque>
        )}
        {whatsapp && /^\d{8,15}$/.test(whatsapp) && (
          <Bloque titulo="WhatsApp">
            <a
              href={enlaceWhatsappGeneral(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-whatsapp-fuerte hover:bg-whatsapp-fuerte-hover inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-4 font-semibold text-white"
            >
              <IconoWhatsapp />
              Escribinos por WhatsApp
            </a>
          </Bloque>
        )}
        <Bloque titulo="Sobre el negocio">
          <p className="text-tinta-suave break-words">
            {nombre} es un catálogo de autos usados y repuestos. Podés explorar los artículos y ver
            cómo funciona el proceso de consulta por WhatsApp.
          </p>
        </Bloque>
        {condiciones.map(
          ([titulo, texto]) =>
            texto?.trim() && (
              <Bloque key={titulo} titulo={titulo}>
                <p className="text-tinta-suave break-words whitespace-pre-line">{texto.trim()}</p>
              </Bloque>
            ),
        )}
      </div>
      {preguntas.length > 0 && (
        <Bloque titulo="Preguntas frecuentes">
          {preguntas.map(({ pregunta, respuesta }, i) => (
            <details key={i} className="border-borde border-t">
              <summary className="min-h-11 cursor-pointer py-3 font-semibold break-words">
                {pregunta.trim()}
              </summary>
              <p className="text-tinta-suave pb-3 break-words whitespace-pre-line">
                {respuesta.trim()}
              </p>
            </details>
          ))}
        </Bloque>
      )}
      {redes.length > 0 && (
        <Bloque titulo="Redes sociales">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {redes.map(({ red, url }, i) => (
              <li key={i} className="min-w-0">
                <a
                  className={`${enlace} break-all`}
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {red.trim()}
                </a>
              </li>
            ))}
          </ul>
        </Bloque>
      )}
    </div>
  );
}
