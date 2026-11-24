import { z } from "zod";

export const esquemaLogin = z.object({
  email: z.string().trim().min(1, "Escribí tu correo."),
  password: z.string().min(1, "Escribí tu contraseña."),
});

export const esquemaContrasena = z
  .object({
    password: z.string().min(8, "Usá al menos 8 caracteres."),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    path: ["confirmar"],
    message: "Las contraseñas no coinciden.",
  });

export const esquemaRecuperar = z.object({
  email: z.string().trim().email("Escribí un correo válido."),
});

/**
 * Adónde volver tras el login: solo rutas del propio panel (nada de redirecciones abiertas,
 * `//otro.sitio` incluido).
 */
export function destinoSeguro(siguiente: string | null, base: string, porDefecto: string): string {
  if (!siguiente || siguiente.startsWith("//")) return porDefecto;
  const dentro =
    siguiente === base || siguiente.startsWith(`${base}/`) || siguiente.startsWith(`${base}?`);
  return dentro && !siguiente.startsWith(`${base}/login`) ? siguiente : porDefecto;
}
