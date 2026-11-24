export function enlaceWhatsappGeneral(numero: string): string {
  const mensaje = "Hola, vengo de la web de Garaje Ruta.";
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function enlaceWhatsapp(numero: string, titulo: string, urlArticulo: string): string {
  const mensaje = `Hola, me interesa: ${titulo} – ${urlArticulo}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
