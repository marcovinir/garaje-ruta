"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { FormProvider, get, useForm } from "react-hook-form";

import { ApiError, camposPlanos } from "@/shared/api/navegador";
import type { Catalogos } from "@/shared/api/tipos";

import { CLAVE_ARTICULOS } from "../articulos/api";
import { mensajeDe } from "../auth/api";
import { rutaPanel } from "../rutaPanel";
import { useAvisos } from "../ui/contextoAvisos";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, TARJETA } from "../ui/estilos";
import { articulosApi, claveDetalle } from "./api";
import {
  aEscritura,
  cambios,
  desdeDetalle,
  esquemaArticulo,
  type ValoresFormulario,
  valoresIniciales,
} from "./esquema";
import { SeccionAuto, SeccionDatos, SeccionRepuesto } from "./Secciones";
import type { DetallePanel } from "./tipos";

type Props = {
  tipo: "auto" | "repuesto";
  catalogos: Catalogos;
  detalle?: DetallePanel;
  /** Columna derecha en escritorio (las fotos, tarea 7). */
  lateral?: ReactNode;
};

/**
 * Formulario de autos y repuestos (§11): una columna en el celular, dos en escritorio
 * (datos | fotos). Crear = POST; editar = PATCH solo con lo que cambió. Los errores de Django,
 * también los anidados (`auto.anio`), quedan junto a su campo.
 */
export function FormularioArticulo({ tipo, catalogos, detalle, lateral }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { avisar } = useAvisos();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [inicial] = useState(() =>
    detalle ? desdeDetalle(detalle, catalogos) : valoresIniciales(tipo),
  );
  const metodos = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaArticulo(tipo)),
    defaultValues: inicial,
  });
  const { handleSubmit, setError, getValues, formState } = metodos;

  const guardar = useMutation({
    mutationFn: async (valores: ValoresFormulario) => {
      const escritura = aEscritura(valores);
      if (!detalle) return articulosApi.crear(escritura);
      const cuerpo = cambios(aEscritura(inicial), escritura);
      return Object.keys(cuerpo).length ? articulosApi.editar(detalle.id, cuerpo) : detalle;
    },
    onSuccess: (guardado) => {
      qc.invalidateQueries({ queryKey: CLAVE_ARTICULOS });
      qc.removeQueries({ queryKey: claveDetalle(guardado.id) });
      avisar(`Guardado: ${guardado.titulo}`);
      router.push(rutaPanel("articulos"));
    },
    onError: (error) => {
      // 401/403 de sesión los resuelve el proveedor del panel (lleva al login).
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setErrorGeneral(mensajeDe(error));
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        const sueltos: string[] = [];
        for (const [campo, mensajes] of Object.entries(camposPlanos(error.campos))) {
          if (get(getValues(), campo) !== undefined) {
            setError(campo as keyof ValoresFormulario, {
              type: "server",
              message: mensajes.join(" "),
            });
          } else {
            sueltos.push(...mensajes);
          }
        }
        setErrorGeneral([error.detalle, ...sueltos].join(" "));
        return;
      }
      setErrorGeneral(mensajeDe(error));
    },
  });

  // Avisar antes de salir con cambios sin guardar.
  const sinGuardar = formState.isDirty && !guardar.isSuccess;
  useEffect(() => {
    if (!sinGuardar) return;
    const avisarSalida = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisarSalida);
    return () => window.removeEventListener("beforeunload", avisarSalida);
  }, [sinGuardar]);

  return (
    <FormProvider {...metodos}>
      <form
        noValidate
        onSubmit={handleSubmit(
          (v) => {
            setErrorGeneral(null);
            guardar.mutate(v);
          },
          () => setErrorGeneral("Revisá los campos marcados."),
        )}
        className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      >
        <div className="flex min-w-0 flex-col gap-5">
          <SeccionDatos />
          {tipo === "auto" ? (
            <SeccionAuto catalogos={catalogos} />
          ) : (
            <SeccionRepuesto catalogos={catalogos} />
          )}
        </div>
        <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-6">
          {lateral}
          <div className={`${TARJETA} flex flex-col gap-3 p-4`}>
            {errorGeneral ? (
              <p role="alert" className="text-rojo-oscuro font-semibold">
                {errorGeneral}
              </p>
            ) : null}
            <button type="submit" disabled={guardar.isPending} className={BOTON_PRIMARIO}>
              {guardar.isPending ? "Guardando…" : "Guardar"}
            </button>
            <Link href={rutaPanel("articulos")} className={BOTON_SECUNDARIO}>
              Cancelar
            </Link>
          </div>
        </aside>
      </form>
    </FormProvider>
  );
}
