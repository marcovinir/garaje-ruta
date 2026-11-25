/** Buscador del encabezado: envía a /buscar (las sugerencias llegan en la Tarea 3 de #115). */
export function Buscador({ id }: { id: string }) {
  return (
    <form
      role="search"
      action="/buscar"
      className="bg-campo border-borde flex min-w-0 flex-1 gap-1.5 rounded-xl border p-1"
    >
      <label htmlFor={id} className="sr-only">
        Buscar marca, modelo o pieza
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Buscá marca, modelo o pieza…"
        className="placeholder:text-tinta-suave min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
      />
      <button
        type="submit"
        className="bg-rojo hover:bg-rojo-fuerte min-h-10 rounded-lg px-4 font-semibold text-white"
      >
        Buscar
      </button>
    </form>
  );
}
