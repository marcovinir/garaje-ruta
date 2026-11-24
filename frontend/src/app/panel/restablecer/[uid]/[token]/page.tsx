import type { Metadata } from "next";
import { Suspense } from "react";

import { PaginaContrasena } from "@/features/panel/auth/PaginaContrasena";

export const metadata: Metadata = { title: "Contraseña nueva" };

type Props = { params: Promise<{ uid: string; token: string }> };

async function Contenido({ params }: Props) {
  const { uid, token } = await params;
  return <PaginaContrasena modo="restablecer" uid={uid} token={token} />;
}

export default function Pagina({ params }: Props) {
  return (
    <Suspense>
      <Contenido params={params} />
    </Suspense>
  );
}
