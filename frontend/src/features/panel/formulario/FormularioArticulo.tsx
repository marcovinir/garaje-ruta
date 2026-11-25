"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, get, useForm } from "react-hook-form";

import { ApiError, api, camposPlanos } from "@/shared/api/navegador";
import type { Catalogos } from "@/shared/api/tipos";

import { CLAVE_ARTICULOS } from "../articulos/api";
import { mensajeDe } from "../auth/api";
import { EditorFotos } from "../fotos/EditorFotos";
import { useFotos } from "../fotos/useFotos";
import { rutaPanel } from "../rutaPanel";
import { useAvisos } from "../ui/contextoAvisos";
import { Dialogo } from "../ui/Dialogo";
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, TARJETA } from "../ui/estilos";
import { articulosApi, claveDetalle } from "./api";
import { Seccion } from "./campos";
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
};

type Resultado = { articulo: DetallePanel; errorFotos: string | null };

/**
 * Formulario de autos y repuestos (§11): una columna en el celular, dos en escritorio
 * (datos | fotos). Crear = POST; editar = PATCH solo con lo que cambió; después, las fotos con
 * `PUT …/fotos/` si cambiaron. Los errores de Django, también los anidados (`auto.anio`),
 * quedan junto a su campo.
 */
export function FormularioArticulo({ tipo, catalogos, detalle }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { avisar } = useAvisos();
  const fotos = useFotos(detalle?.fotos ?? []);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmarFotos, setConfirmarFotos] = useState<ValoresFormulario | null>(null);
  const [inicial] = useState(() =>
    detalle ? desdeDetalle(detalle, catalogos) : valoresIniciales(tipo),
  );
  const metodos = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaArticulo(tipo, catalogos)),
    defaultValues: inicial,
  });
  const { handleSubmit, setError, getValues, formState } = metodos;

  const guardar = useMutation({
    mutationFn: async (valores: ValoresFormulario): Promise<Resultado> => {
      const escritura = aEscritura(valores, catalogos);
      let articulo: DetallePanel;
      if (!detalle) {
        articulo = await articulosApi.crear(escritura);
      } else {
        const cuerpo = cambios(aEscritura(inicial, catalogos), escritura);
        articulo = Object.keys(cuerpo).length
          ? await articulosApi.editar(detalle.id, cuerpo)
          : detalle;
      }
      // El artículo ya quedó guardado: un fallo en las fotos se avisa aparte.
      if (fotos.cambiado()) {
        try {
          await api(`/panel/articulos/${articulo.id}/fotos/`, {
            metodo: "PUT",
            cuerpo: fotos.listas(),
          });
        } catch (error) {
          return { articulo, errorFotos: mensajeDe(error) };
        }
      }
      return { articulo, errorFotos: null };
    },
    onSuccess: ({ articulo, errorFotos }) => {
      qc.invalidateQueries({ queryKey: CLAVE_ARTICULOS });
      qc.removeQueries({ queryKey: claveDetalle(articulo.id) });
      if (errorFotos) {
        avisar(`Se guardó «${articulo.titulo}», pero no las fotos: ${errorFotos}`, {
          tipo: "error",
        });
        router.push(rutaPanel(`articulos/${articulo.id}`));
        return;
      }
      avisar(`Guardado: ${articulo.titulo}`);
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
  const sinGuardar = (formState.isDirty || fotos.cambiado()) && !guardar.isSuccess;
  useEffect(() => {
    if (!sinGuardar) return;
    const avisarSalida = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisarSalida);
    return () => window.removeEventListener("beforeunload", avisarSalida);
  }, [sinGuardar]);

  function enviar(valores: ValoresFormulario) {
    setErrorGeneral(null);
    if (fotos.ocupado) return;
    if (fotos.conError) {
      setConfirmarFotos(valores);
      return;
    }
    guardar.mutate(valores);
  }

  return (
    <FormProvider {...metodos}>
      <form
        noValidate
        onSubmit={handleSubmit(enviar, () => setErrorGeneral("Revisá los campos marcados."))}
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
          <Seccion titulo="Fotos">
            <EditorFotos fotos={fotos} />
          </Seccion>
          <div className={`${TARJETA} flex flex-col gap-3 p-4`}>
            {errorGeneral ? (
              <p role="alert" className="text-rojo-oscuro font-semibold">
                {errorGeneral}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={guardar.isPending || fotos.ocupado}
              className={BOTON_PRIMARIO}
            >
              {fotos.ocupado
                ? "Esperando las fotos…"
                : guardar.isPending
                  ? "Guardando…"
                  : "Guardar"}
            </button>
            <Link href={rutaPanel("articulos")} className={BOTON_SECUNDARIO}>
              Cancelar
            </Link>
          </div>
        </aside>
      </form>
      <Dialogo
        abierto={confirmarFotos !== null}
        titulo="¿Guardar sin esas fotos?"
        textoConfirmar="Guardar sin esas fotos"
        textoCancelar="Volver a las fotos"
        alConfirmar={() => {
          const valores = confirmarFotos;
          setConfirmarFotos(null);
          if (valores) guardar.mutate(valores);
        }}
        alCerrar={() => setConfirmarFotos(null)}
      >
        Algunas fotos no se pudieron subir. Podés reintentarlas o guardar solo las que sí subieron.
      </Dialogo>
    </FormProvider>
  );
}
