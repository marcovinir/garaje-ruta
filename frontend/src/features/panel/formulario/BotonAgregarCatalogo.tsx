"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { ApiError } from "@/shared/api/navegador";
import type { CategoriaApi } from "@/shared/api/tipos";

import { mensajeDe } from "../auth/api";
import { useSesion } from "../auth/useSesion";
import { Campo, propsCampo } from "../ui/Campo";
import { Dialogo } from "../ui/Dialogo";
import { BOTON_SECUNDARIO, CAMPO } from "../ui/estilos";
import { CLAVE_CATALOGOS, type TipoCatalogo, catalogosApi } from "./api";

const NOMBRES: Record<TipoCatalogo, string> = {
  marca: "marca",
  modelo: "modelo",
  categoria: "categoría",
};

function aplanar(categorias: CategoriaApi[], nivel = 0): { id: number; texto: string }[] {
  return categorias.flatMap((c) => [
    { id: c.id, texto: `${"— ".repeat(nivel)}${c.nombre}` },
    ...aplanar(c.hijas, nivel + 1),
  ]);
}

/**
 * «+» junto al select: agrega una marca, un modelo o una categoría sin salir del formulario
 * (permiso `catalogos.agregar`, §9) y la deja elegida.
 */
export function BotonAgregarCatalogo({
  tipo,
  marca,
  categorias = [],
  alCrear,
}: {
  tipo: TipoCatalogo;
  marca?: string;
  categorias?: CategoriaApi[];
  alCrear: (id: string) => void;
}) {
  const { puede } = useSesion();
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [padre, setPadre] = useState("");
  const id = useId();
  const crear = useMutation({
    mutationFn: () =>
      catalogosApi.crear(tipo, {
        nombre: nombre.trim(),
        ...(tipo === "modelo" ? { marca: Number(marca) } : {}),
        ...(tipo === "categoria" ? { padre: padre ? Number(padre) : null } : {}),
      }),
    onSuccess: async (nuevo) => {
      await qc.invalidateQueries({ queryKey: CLAVE_CATALOGOS });
      // El select es no controlado: se elige cuando su opción nueva ya se dibujó.
      setTimeout(() => alCrear(String(nuevo.id)), 0);
      setAbierto(false);
      setNombre("");
    },
  });

  if (!puede("catalogos.agregar")) return null;
  const etiqueta = `Agregar ${NOMBRES[tipo]}`;
  const sinMarca = tipo === "modelo" && !marca;
  const error =
    crear.error instanceof ApiError
      ? ((crear.error.campos.nombre as string[] | undefined)?.join(" ") ?? mensajeDe(crear.error))
      : crear.error
        ? mensajeDe(crear.error)
        : undefined;

  return (
    <>
      <button
        type="button"
        aria-label={etiqueta}
        title={sinMarca ? "Primero elegí la marca" : etiqueta}
        disabled={sinMarca}
        onClick={() => {
          crear.reset();
          setAbierto(true);
        }}
        className={`${BOTON_SECUNDARIO} w-11 shrink-0 px-0 text-xl`}
      >
        <span aria-hidden="true">+</span>
      </button>
      <Dialogo
        abierto={abierto}
        titulo={etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)}
        textoConfirmar="Agregar"
        ocupado={crear.isPending || !nombre.trim()}
        alConfirmar={() => crear.mutate()}
        alCerrar={() => setAbierto(false)}
      >
        <div className="text-tinta flex flex-col gap-3">
          <Campo id={`${id}-nombre`} etiqueta="Nombre" error={error}>
            <input
              {...propsCampo(`${id}-nombre`, error)}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              // El diálogo vive dentro del formulario del artículo: Enter no debe enviarlo.
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (nombre.trim()) crear.mutate();
                }
              }}
              className={CAMPO}
            />
          </Campo>
          {tipo === "categoria" ? (
            <Campo id={`${id}-padre`} etiqueta="Dentro de (opcional)">
              <select
                id={`${id}-padre`}
                value={padre}
                onChange={(e) => setPadre(e.target.value)}
                className={CAMPO}
              >
                <option value="">Ninguna (categoría principal)</option>
                {aplanar(categorias).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.texto}
                  </option>
                ))}
              </select>
            </Campo>
          ) : null}
        </div>
      </Dialogo>
    </>
  );
}

export { aplanar as aplanarCategorias };
