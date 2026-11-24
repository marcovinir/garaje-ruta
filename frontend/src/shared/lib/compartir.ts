export type ResultadoCompartir = "compartido" | "copiado" | "cancelado" | "error";

/**
 * Compartir (RF-29): el menú del teléfono (`navigator.share`) cuando existe; si no, copia el
 * enlace. La web pública y el panel lo usan igual.
 */
export async function compartirEnlace(titulo: string, url: string): Promise<ResultadoCompartir> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: titulo, url });
      return "compartido";
    } catch (error) {
      return error instanceof Error && error.name === "AbortError" ? "cancelado" : "error";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copiado";
  } catch {
    return "error";
  }
}
