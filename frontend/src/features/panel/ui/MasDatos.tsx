import type { ReactNode } from "react";

import { TARJETA } from "./estilos";

export function MasDatos({ children, conErrores }: { children: ReactNode; conErrores: boolean }) {
  return (
    <details className={`${TARJETA} p-4 sm:p-5`} open={conErrores || undefined}>
      <summary className="titulo cursor-pointer text-2xl">Más datos</summary>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </details>
  );
}
