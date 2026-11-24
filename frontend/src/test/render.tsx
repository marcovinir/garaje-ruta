import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { ProveedorConsultas } from "@/features/panel/consultas";

import type { Rol } from "./datos";
import { router } from "./navegacion";
import { sesion } from "./servidor";

/** Renderiza dentro de los proveedores del panel, con la sesión del rol indicado (o sin sesión). */
export function renderPanel(
  ui: ReactElement,
  { usuario = "admin" }: { usuario?: Rol | null } = {},
) {
  sesion.rol = usuario;
  return render(<ProveedorConsultas irA={router.replace}>{ui}</ProveedorConsultas>);
}
