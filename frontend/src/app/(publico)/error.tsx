"use client";

export default function ErrorGeneral({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="titulo text-4xl">Algo salió mal</h1>
      <p className="text-tinta-suave">
        No pudimos cargar esta página. Probá de nuevo en un momento.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-rojo hover:bg-rojo-fuerte min-h-11 rounded-xl px-5 font-semibold text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
