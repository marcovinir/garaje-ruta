"use client";

import { get, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type { Catalogos } from "@/shared/api/tipos";

import { BOTON_SECUNDARIO, BOTON_TENUE } from "../ui/estilos";
import { BotonAgregarCatalogo, aplanarCategorias } from "./BotonAgregarCatalogo";
import {
  CampoArea,
  CampoCasilla,
  CampoSeleccion,
  CampoTexto,
  type Opcion,
  REJILLA,
  Seccion,
} from "./campos";
import { compatibilidadVacia, type ValoresFormulario } from "./esquema";

const aOpciones = (lista: { id: number; nombre: string }[]): Opcion[] =>
  [...lista]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((x) => ({ valor: String(x.id), texto: x.nombre }));

function modelosDe(catalogos: Catalogos, marca: string): Opcion[] {
  return aOpciones(catalogos.marcas.find((m) => String(m.id) === marca)?.modelos ?? []);
}

export function SeccionDatos() {
  return (
    <Seccion titulo="Datos">
      <CampoTexto nombre="titulo" etiqueta="Título" placeholder="Ej.: Toyota Corolla 2015 SE" />
      <div className={REJILLA}>
        <CampoTexto nombre="precio_colones" etiqueta="Precio (₡)" numerico />
        <CampoTexto
          nombre="precio_anterior_colones"
          etiqueta="Precio anterior (₡)"
          numerico
          ayuda="Solo si está en oferta: el precio de antes, mayor que el actual."
        />
      </div>
      <CampoArea nombre="descripcion" etiqueta="Descripción" />
      <CampoCasilla nombre="destacado" etiqueta="Destacado en el inicio" />
    </Seccion>
  );
}

export function SeccionAuto({ catalogos }: { catalogos: Catalogos }) {
  const { setValue } = useFormContext<ValoresFormulario>();
  const marca = useWatch<ValoresFormulario, "auto.marca">({ name: "auto.marca" });
  const elegir = (nombre: "auto.marca" | "auto.modelo", id: string) =>
    setValue(nombre, id, { shouldDirty: true, shouldValidate: true });

  return (
    <>
      <Seccion titulo="Ficha técnica">
        <div className={REJILLA}>
          <CampoSeleccion
            nombre="auto.marca"
            etiqueta="Marca"
            opciones={aOpciones(catalogos.marcas)}
            alCambiar={() => setValue("auto.modelo", "", { shouldDirty: true })}
            extra={
              <BotonAgregarCatalogo
                tipo="marca"
                alCrear={(id) => {
                  elegir("auto.marca", id);
                  setValue("auto.modelo", "");
                }}
              />
            }
          />
          <CampoSeleccion
            nombre="auto.modelo"
            etiqueta="Modelo"
            opciones={modelosDe(catalogos, marca)}
            vacio={marca ? "Elegí…" : "Primero la marca"}
            extra={
              <BotonAgregarCatalogo
                tipo="modelo"
                marca={marca}
                alCrear={(id) => elegir("auto.modelo", id)}
              />
            }
          />
          <CampoTexto nombre="auto.anio" etiqueta="Año" numerico />
          <CampoTexto nombre="auto.version" etiqueta="Versión" placeholder="Ej.: SE, LX, 4x4" />
          <CampoTexto nombre="auto.kilometraje" etiqueta="Kilometraje" numerico />
          <CampoSeleccion
            nombre="auto.transmision"
            etiqueta="Transmisión"
            opciones={aOpciones(catalogos.transmisiones)}
          />
          <CampoSeleccion
            nombre="auto.combustible"
            etiqueta="Combustible"
            opciones={aOpciones(catalogos.combustibles)}
          />
          <CampoSeleccion
            nombre="auto.traccion"
            etiqueta="Tracción"
            opciones={aOpciones(catalogos.tracciones)}
          />
          <CampoSeleccion
            nombre="auto.carroceria"
            etiqueta="Carrocería"
            opciones={aOpciones(catalogos.carrocerias)}
          />
          <CampoTexto nombre="auto.cilindrada_cc" etiqueta="Motor (cc)" numerico />
          <CampoTexto nombre="auto.color_exterior" etiqueta="Color exterior" />
          <CampoTexto nombre="auto.color_interior" etiqueta="Color interior" />
          <CampoTexto nombre="auto.puertas" etiqueta="Puertas" numerico />
          <CampoTexto nombre="auto.pasajeros" etiqueta="Pasajeros" numerico />
          <CampoTexto nombre="auto.bolsas_aire" etiqueta="Bolsas de aire" numerico />
        </div>
      </Seccion>
      <Seccion titulo="Papeles y condiciones">
        <div className={REJILLA}>
          <CampoSeleccion
            nombre="auto.estado_general"
            etiqueta="Estado general"
            vacio={null}
            opciones={[
              { valor: "excelente", texto: "Excelente" },
              { valor: "muy_bueno", texto: "Muy bueno" },
              { valor: "bueno", texto: "Bueno" },
              { valor: "regular", texto: "Regular" },
            ]}
          />
          <CampoSeleccion
            nombre="auto.procedencia"
            etiqueta="Procedencia"
            vacio={null}
            opciones={[
              { valor: "agencia", texto: "Agencia" },
              { valor: "importado", texto: "Importado" },
            ]}
          />
          <CampoTexto nombre="auto.riteve_vence" etiqueta="RTV vence" tipo="date" />
          <CampoTexto
            nombre="auto.placa_termina_en"
            etiqueta="Placa termina en"
            numerico
            ayuda="Un dígito (define el mes del marchamo)."
          />
        </div>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <CampoCasilla nombre="auto.unico_dueno" etiqueta="Único dueño" />
          <CampoCasilla nombre="auto.marchamo_al_dia" etiqueta="Marchamo al día" />
          <CampoCasilla nombre="auto.impuestos_pagados" etiqueta="Impuestos pagados" />
          <CampoCasilla nombre="auto.acepta_vehiculo" etiqueta="Recibe vehículo" />
          <CampoCasilla nombre="auto.precio_negociable" etiqueta="Precio negociable" />
        </div>
      </Seccion>
      <Equipamiento catalogos={catalogos} />
    </>
  );
}

function Equipamiento({ catalogos }: { catalogos: Catalogos }) {
  const { register } = useFormContext<ValoresFormulario>();
  return (
    <Seccion titulo="Equipamiento">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {catalogos.equipamiento.map((g) => (
          <fieldset key={g.grupo} className="flex flex-col">
            <legend className="mb-1 font-bold">{g.grupo}</legend>
            {g.items.map((item) => (
              <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  {...register("auto.equipamiento")}
                  type="checkbox"
                  value={String(item.id)}
                  className="accent-rojo size-5"
                />
                <span>{item.nombre}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </Seccion>
  );
}

export function SeccionRepuesto({ catalogos }: { catalogos: Catalogos }) {
  const { setValue } = useFormContext<ValoresFormulario>();
  return (
    <>
      <Seccion titulo="Datos del repuesto">
        <div className={REJILLA}>
          <CampoSeleccion
            nombre="repuesto.categoria_pieza"
            etiqueta="Categoría"
            opciones={aplanarCategorias(catalogos.categorias).map((c) => ({
              valor: String(c.id),
              texto: c.texto,
            }))}
            extra={
              <BotonAgregarCatalogo
                tipo="categoria"
                categorias={catalogos.categorias}
                alCrear={(id) =>
                  setValue("repuesto.categoria_pieza", id, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            }
          />
          <CampoSeleccion
            nombre="repuesto.condicion"
            etiqueta="Condición"
            vacio={null}
            opciones={[
              { valor: "nuevo", texto: "Nuevo" },
              { valor: "usado", texto: "Usado" },
            ]}
          />
          <CampoTexto
            nombre="repuesto.cantidad"
            etiqueta="Cantidad"
            numerico
            ayuda="Para reponer, cambiá este número."
          />
          <CampoTexto nombre="repuesto.codigo_interno" etiqueta="Código interno" />
          <CampoTexto nombre="repuesto.numero_parte" etiqueta="Número de parte" />
        </div>
      </Seccion>
      <Compatibilidades catalogos={catalogos} />
    </>
  );
}

function FilaCompatibilidad({
  indice,
  catalogos,
  alQuitar,
}: {
  indice: number;
  catalogos: Catalogos;
  alQuitar: () => void;
}) {
  const { setValue } = useFormContext<ValoresFormulario>();
  const base = `repuesto.compatibilidades.${indice}` as const;
  const marca = useWatch<ValoresFormulario, `repuesto.compatibilidades.${number}.marca`>({
    name: `${base}.marca`,
  });
  return (
    <fieldset className="border-borde flex flex-col gap-3 rounded-xl border p-3">
      <legend className="px-1 text-sm font-bold">Compatibilidad {indice + 1}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CampoSeleccion
          nombre={`${base}.marca`}
          etiqueta="Marca"
          opciones={aOpciones(catalogos.marcas)}
          alCambiar={() => setValue(`${base}.modelo`, "", { shouldDirty: true })}
        />
        <CampoSeleccion
          nombre={`${base}.modelo`}
          etiqueta="Modelo"
          opciones={modelosDe(catalogos, marca)}
          vacio={marca ? "Elegí…" : "Primero la marca"}
          extra={
            <BotonAgregarCatalogo
              tipo="modelo"
              marca={marca}
              alCrear={(id) =>
                setValue(`${base}.modelo`, id, { shouldDirty: true, shouldValidate: true })
              }
            />
          }
        />
        <CampoTexto nombre={`${base}.anio_desde`} etiqueta="Desde el año" numerico />
        <CampoTexto nombre={`${base}.anio_hasta`} etiqueta="Hasta el año" numerico />
      </div>
      <button
        type="button"
        onClick={alQuitar}
        aria-label={`Quitar la compatibilidad ${indice + 1}`}
        className={`${BOTON_TENUE} self-start`}
      >
        Quitar
      </button>
    </fieldset>
  );
}

function Compatibilidades({ catalogos }: { catalogos: Catalogos }) {
  const {
    formState: { errors },
  } = useFormContext<ValoresFormulario>();
  const { fields, append, remove } = useFieldArray<ValoresFormulario, "repuesto.compatibilidades">({
    name: "repuesto.compatibilidades",
  });
  const error =
    (get(errors, "repuesto.compatibilidades") as { message?: string } | undefined)?.message ??
    (get(errors, "repuesto.compatibilidades.root") as { message?: string } | undefined)?.message;
  return (
    <Seccion titulo="Compatible con">
      {fields.map((campo, i) => (
        <FilaCompatibilidad
          key={campo.id}
          indice={i}
          catalogos={catalogos}
          alQuitar={() => remove(i)}
        />
      ))}
      {error ? (
        <p role="alert" className="text-rojo-oscuro font-semibold">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => append(compatibilidadVacia())}
        className={`${BOTON_SECUNDARIO} self-start`}
      >
        Agregar compatibilidad
      </button>
    </Seccion>
  );
}
