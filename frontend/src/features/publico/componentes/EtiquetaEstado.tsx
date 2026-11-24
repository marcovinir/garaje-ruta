const ESTADOS = {
  disponible: { texto: "Disponible", clase: "bg-disponible text-disponible-tinta" },
  reservado: { texto: "Reservado", clase: "bg-reservado text-reservado-tinta" },
  vendido: { texto: "Vendido", clase: "bg-vendido text-vendido-tinta" },
  agotado: { texto: "Agotado", clase: "bg-agotado text-agotado-tinta" },
  // Solo en el panel: la web nunca muestra un artículo oculto.
  oculto: { texto: "Oculto", clase: "border-borde-campo text-tinta-suave border border-dashed" },
} as const;

export function EtiquetaEstado({ estado }: { estado: keyof typeof ESTADOS }) {
  const { texto, clase } = ESTADOS[estado];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${clase}`}>
      {texto}
    </span>
  );
}
