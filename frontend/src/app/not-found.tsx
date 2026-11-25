import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="titulo text-4xl">No encontramos esa página</h1>
      <p className="text-tinta-suave">
        Puede que el enlace esté incompleto o que el artículo ya no exista.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/autos"
          className="bg-rojo hover:bg-rojo-fuerte rounded-xl px-5 py-3 font-semibold text-white"
        >
          Ver autos
        </Link>
        <Link
          href="/repuestos"
          className="border-borde bg-tarjeta rounded-xl border px-5 py-3 font-semibold"
        >
          Ver repuestos
        </Link>
      </div>
    </main>
  );
}
