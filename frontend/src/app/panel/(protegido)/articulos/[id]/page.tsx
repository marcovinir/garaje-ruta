import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PaginaEditar } from "@/features/panel/formulario/PaginaEditar";

export const metadata: Metadata = { title: "Editar artículo" };

// Depende de la sesión del navegador (ver el layout de `(protegido)`).
export const instant = false;

type Props = { params: Promise<{ id: string }> };

async function Contenido({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <PaginaEditar id={Number(id)} />;
}

export default function Editar({ params }: Props) {
  return (
    <Suspense>
      <Contenido params={params} />
    </Suspense>
  );
}
