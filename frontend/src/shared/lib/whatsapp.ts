export function enlaceWhatsapp(numero: string, titulo: string, urlArticulo: string): string {
  const mensaje = `Hola, me interesa: ${titulo} – ${urlArticulo}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
