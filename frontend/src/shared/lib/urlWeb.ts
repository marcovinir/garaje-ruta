/** Solo enlaces web absolutos, aptos para mostrar en el catálogo público. */
export function esUrlWeb(valor: string): boolean {
  if (!/^https?:\/\/[^\s]+$/i.test(valor)) return false;
  try {
    return Boolean(new URL(valor).hostname);
  } catch {
    return false;
  }
}
