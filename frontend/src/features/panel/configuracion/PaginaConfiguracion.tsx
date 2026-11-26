"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type FieldPath, get, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError, api, camposPlanos } from "@/shared/api/navegador";
import type { Configuracion } from "@/shared/api/tipos";
import { esUrlWeb } from "@/shared/lib/urlWeb";

import { mensajeDe } from "../auth/api";
import { useSesion } from "../auth/useSesion";
import { Campo, propsCampo } from "../ui/Campo";
import { useAvisos } from "../ui/contextoAvisos";
import { MasDatos } from "../ui/MasDatos";
import { EncabezadoPagina } from "../ui/EncabezadoPagina";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, BOTON_TENUE, CAMPO, TARJETA } from "../ui/estilos";

const CLAVE = ["panel", "configuracion"] as const;
// 0 = lunes … 6 = domingo (HorarioAtencion en backend/apps/negocio/models.py).
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const textoComercial = z.string().trim().max(1000, "Máximo 1000 caracteres.");
const CONDICIONES = {
  garantia_repuestos: "Garantía general de repuestos",
  condiciones_devolucion: "Condiciones de devolución",
  metodos_entrega: "Métodos de entrega",
  metodos_pago: "Métodos de pago",
  condiciones_compra: "Condiciones de compra",
} as const;
const camposComerciales = Object.keys(CONDICIONES) as (keyof typeof CONDICIONES)[];

const MAX_FILAS = 20;
const obligatorio = (limite: number) =>
  z.string().trim().min(1, "Completá este campo.").max(limite, `Máximo ${limite} caracteres.`);

const esquema = z.object({
  preguntas_frecuentes: z
    .array(
      z.object({
        pregunta: obligatorio(160),
        respuesta: obligatorio(1000),
      }),
    )
    .max(MAX_FILAS),
  redes_sociales: z
    .array(
      z.object({
        red: obligatorio(60),
        url: obligatorio(500).refine(esUrlWeb, "Pegá el enlace completo (https://…)."),
      }),
    )
    .max(MAX_FILAS),
  garantia_repuestos: textoComercial,
  condiciones_devolucion: textoComercial,
  metodos_entrega: textoComercial,
  metodos_pago: textoComercial,
  condiciones_compra: textoComercial,
  nombre: z.string().trim().min(1, "Completá este campo.").max(80),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "Solo dígitos, con el código de país: 50688887777."),
  direccion: z.string().trim().min(1, "Completá este campo.").max(200),
  mapa_url: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "Pegá el enlace completo (https://…)."),
  horarios: z.array(
    z
      .object({
        dia_semana: z.string(),
        apertura: z.string().regex(HORA, "Hora no válida."),
        cierre: z.string().regex(HORA, "Hora no válida."),
      })
      .refine((h) => !HORA.test(h.apertura) || !HORA.test(h.cierre) || h.cierre > h.apertura, {
        path: ["cierre"],
        message: "Tiene que ser después de la apertura.",
      }),
  ),
});
type Valores = z.infer<typeof esquema>;

function aValores(c: Configuracion): Valores {
  return {
    nombre: c.nombre,
    whatsapp: c.whatsapp,
    direccion: c.direccion,
    mapa_url: c.mapa_url,
    garantia_repuestos: c.garantia_repuestos ?? "",
    condiciones_devolucion: c.condiciones_devolucion ?? "",
    metodos_entrega: c.metodos_entrega ?? "",
    metodos_pago: c.metodos_pago ?? "",
    condiciones_compra: c.condiciones_compra ?? "",
    preguntas_frecuentes: c.preguntas_frecuentes ?? [],
    redes_sociales: c.redes_sociales ?? [],
    horarios: c.horarios.map((h) => ({ ...h, dia_semana: String(h.dia_semana) })),
  };
}

const mensaje = (errores: object, nombre: string) =>
  (get(errores, nombre) as { message?: string } | undefined)?.message;

function Formulario({ actual, editable }: { actual: Configuracion; editable: boolean }) {
  const qc = useQueryClient();
  const { avisar } = useAvisos();
  const [general, setGeneral] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: aValores(actual) });
  const horarios = useFieldArray({ control, name: "horarios" });
  const preguntas = useFieldArray({ control, name: "preguntas_frecuentes" });
  const redes = useFieldArray({ control, name: "redes_sociales" });

  const guardar = useMutation({
    mutationFn: (v: Valores) =>
      api<Configuracion>("/panel/configuracion/", {
        metodo: "PUT",
        cuerpo: {
          ...v,
          ...Object.fromEntries(camposComerciales.map((campo) => [campo, v[campo] || null])),
          logo_public_id: actual.logo_public_id,
          horarios: v.horarios.map((h) => ({ ...h, dia_semana: Number(h.dia_semana) })),
        },
      }),
    onSuccess: (guardada) => {
      qc.setQueryData(CLAVE, guardada);
      avisar("Datos del negocio guardados.");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        for (const [campo, mensajes] of Object.entries(camposPlanos(error.campos))) {
          setError(campo as FieldPath<Valores>, { message: mensajes.join(" ") });
        }
        setGeneral(error.detalle);
        return;
      }
      setGeneral(mensajeDe(error));
    },
  });

  const texto = (
    nombre: "nombre" | "whatsapp" | "direccion" | "mapa_url",
    etiqueta: string,
    ayuda?: string,
  ) => {
    const id = `config-${nombre}`;
    const error = errors[nombre]?.message;
    return (
      <Campo id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}>
        <input
          {...register(nombre)}
          {...propsCampo(id, error, ayuda)}
          inputMode={nombre === "whatsapp" ? "numeric" : undefined}
          className={CAMPO}
        />
      </Campo>
    );
  };

  function textoLista(
    nombre: FieldPath<Valores>,
    etiqueta: string,
    tipo: "text" | "url" | "area" = "text",
  ) {
    const id = `config-${nombre.replaceAll(".", "-")}`;
    const error = mensaje(errors, nombre);
    return (
      <Campo id={id} etiqueta={etiqueta} error={error}>
        {tipo === "area" ? (
          <textarea
            {...register(nombre)}
            {...propsCampo(id, error)}
            rows={3}
            className={`${CAMPO} py-2`}
          />
        ) : (
          <input {...register(nombre)} {...propsCampo(id, error)} type={tipo} className={CAMPO} />
        )}
      </Campo>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => {
        setGeneral(null);
        guardar.mutate(v);
      })}
      className="flex flex-col gap-5"
    >
      {editable ? (
        // Arriba y fija al bajar (debajo de la barra del celular), para guardar sin ir al final.
        <div
          className={`${TARJETA} sticky top-[calc(3.25rem+1px)] z-10 flex flex-wrap items-center justify-between gap-3 p-3 shadow-sm md:top-4`}
        >
          {general ? (
            <p role="alert" className="text-rojo-oscuro font-semibold">
              {general}
            </p>
          ) : (
            <p className="text-tinta-suave hidden text-sm sm:block">
              Los cambios se ven en la web al guardar.
            </p>
          )}
          <button
            type="submit"
            disabled={guardar.isPending}
            className={`${BOTON_PRIMARIO} ml-auto`}
          >
            Guardar
          </button>
        </div>
      ) : (
        <p className="text-tinta-suave">
          Solo quien administra el garaje puede cambiar estos datos.
        </p>
      )}
      <fieldset disabled={!editable} className="flex min-w-0 flex-col gap-5">
        <legend className="sr-only">Datos del negocio</legend>
        <section className={`${TARJETA} grid grid-cols-1 gap-4 p-5 sm:grid-cols-2`}>
          {texto("nombre", "Nombre del negocio")}
          {texto("whatsapp", "WhatsApp", "Con código de país, sin espacios: 50688887777.")}
          {texto("direccion", "Dirección")}
          {texto("mapa_url", "Enlace del mapa", "El enlace de Google Maps para «Cómo llegar».")}
        </section>
        <section className={`${TARJETA} flex flex-col gap-4 p-5`}>
          <h2 className="titulo text-2xl">Horario</h2>
          {horarios.fields.map((campo, i) => {
            const base = `horarios.${i}` as const;
            const id = (c: string) => `config-horario-${i}-${c}`;
            const errAp = mensaje(errors, `${base}.apertura`);
            const errCi = mensaje(errors, `${base}.cierre`);
            return (
              <fieldset
                key={campo.id}
                className="border-borde grid grid-cols-1 items-end gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <legend className="px-1 text-sm font-bold">Horario {i + 1}</legend>
                <Campo id={id("dia")} etiqueta="Día">
                  <select {...register(`${base}.dia_semana`)} id={id("dia")} className={CAMPO}>
                    {DIAS.map((dia, n) => (
                      <option key={dia} value={String(n)}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo id={id("abre")} etiqueta="Abre" error={errAp}>
                  <input
                    {...register(`${base}.apertura`)}
                    {...propsCampo(id("abre"), errAp)}
                    type="time"
                    className={CAMPO}
                  />
                </Campo>
                <Campo id={id("cierra")} etiqueta="Cierra" error={errCi}>
                  <input
                    {...register(`${base}.cierre`)}
                    {...propsCampo(id("cierra"), errCi)}
                    type="time"
                    className={CAMPO}
                  />
                </Campo>
                {editable ? (
                  <button
                    type="button"
                    aria-label={`Quitar el horario ${i + 1}`}
                    onClick={() => horarios.remove(i)}
                    className={BOTON_TENUE}
                  >
                    Quitar
                  </button>
                ) : null}
              </fieldset>
            );
          })}
          {editable ? (
            <button
              type="button"
              onClick={() =>
                horarios.append({ dia_semana: "0", apertura: "08:00", cierre: "17:00" })
              }
              className={`${BOTON_SECUNDARIO} self-start`}
            >
              Agregar horario
            </button>
          ) : null}
          <p className="text-tinta-suave text-sm">
            Para un horario partido, agregá dos tramos el mismo día.
          </p>
        </section>
        <MasDatos conErrores={camposComerciales.some((campo) => Boolean(errors[campo]))}>
          {camposComerciales.map((campo) => {
            const id = `config-${campo}`;
            const error = errors[campo]?.message;
            return (
              <Campo key={campo} id={id} etiqueta={CONDICIONES[campo]} error={error}>
                <textarea
                  {...register(campo)}
                  {...propsCampo(id, error)}
                  rows={3}
                  className={`${CAMPO} py-2`}
                />
              </Campo>
            );
          })}
        </MasDatos>
        <section className={`${TARJETA} flex flex-col gap-4 p-5`}>
          <h2 className="titulo text-2xl">Preguntas frecuentes</h2>
          {preguntas.fields.map((campo, i) => (
            <fieldset
              key={campo.id}
              className="border-borde flex min-w-0 flex-col gap-3 rounded-xl border p-3"
            >
              <legend className="px-1 text-sm font-bold">Pregunta {i + 1}</legend>
              {textoLista(`preguntas_frecuentes.${i}.pregunta`, "Pregunta")}
              {textoLista(`preguntas_frecuentes.${i}.respuesta`, "Respuesta", "area")}
              {editable && (
                <button
                  type="button"
                  onClick={() => preguntas.remove(i)}
                  aria-label={`Quitar la pregunta ${i + 1}`}
                  className={`${BOTON_TENUE} self-start`}
                >
                  Quitar
                </button>
              )}
            </fieldset>
          ))}
          {editable && (
            <button
              type="button"
              disabled={preguntas.fields.length >= MAX_FILAS}
              onClick={() => preguntas.append({ pregunta: "", respuesta: "" })}
              className={`${BOTON_SECUNDARIO} self-start`}
            >
              Agregar pregunta
            </button>
          )}
        </section>
        <section className={`${TARJETA} flex flex-col gap-4 p-5`}>
          <h2 className="titulo text-2xl">Redes sociales</h2>
          {redes.fields.map((campo, i) => (
            <fieldset
              key={campo.id}
              className="border-borde grid min-w-0 items-end gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_2fr_auto]"
            >
              <legend className="px-1 text-sm font-bold">Red social {i + 1}</legend>
              {textoLista(`redes_sociales.${i}.red`, "Nombre de la red")}
              {textoLista(`redes_sociales.${i}.url`, "Enlace de la red", "url")}
              {editable && (
                <button
                  type="button"
                  onClick={() => redes.remove(i)}
                  aria-label={`Quitar la red social ${i + 1}`}
                  className={BOTON_TENUE}
                >
                  Quitar
                </button>
              )}
            </fieldset>
          ))}
          {editable && (
            <button
              type="button"
              disabled={redes.fields.length >= MAX_FILAS}
              onClick={() => redes.append({ red: "", url: "" })}
              className={`${BOTON_SECUNDARIO} self-start`}
            >
              Agregar red social
            </button>
          )}
        </section>
      </fieldset>
    </form>
  );
}

export function PaginaConfiguracion() {
  const { puede } = useSesion();
  const consulta = useQuery({
    queryKey: CLAVE,
    queryFn: () => api<Configuracion>("/panel/configuracion/"),
  });
  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Datos que se muestran en el pie, en Contacto y en los enlaces de WhatsApp."
      />
      {consulta.isError ? (
        <div className={`${TARJETA} flex flex-col items-start gap-3 p-5`}>
          <p role="alert">No pudimos cargar la configuración.</p>
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => consulta.refetch()}>
            Reintentar
          </button>
        </div>
      ) : consulta.data ? (
        <Formulario actual={consulta.data} editable={puede("configuracion.editar")} />
      ) : (
        <div aria-busy="true" className="bg-campo h-64 animate-pulse rounded-2xl" />
      )}
    </div>
  );
}
