import Image from "next/image";
import Link from "next/link";

const ENLACES = [
  { href: "/autos", texto: "Autos" },
  { href: "/repuestos", texto: "Repuestos" },
  { href: "/autos?ofertas=1", texto: "Ofertas" },
  { href: "/#contacto", texto: "Contacto" },
];

function Buscador({ id }: { id: string }) {
  return (
    <form
      role="search"
      action="/buscar"
      className="bg-tarjeta border-borde flex min-w-0 flex-1 gap-1.5 rounded-xl border p-1"
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
        className="bg-rojo hover:bg-rojo-oscuro min-h-11 rounded-lg px-4 font-semibold text-white"
      >
        Buscar
      </button>
    </form>
  );
}

export function Encabezado() {
  return (
    <header className="bg-tarjeta border-borde sticky top-0 z-20 border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Garaje Ruta, inicio" className="shrink-0">
          <Image
            src="/marca/logo-completo.svg"
            alt=""
            width={144}
            height={45}
            priority
            unoptimized
            className="h-10 w-auto"
          />
        </Link>
        <div className="hidden flex-1 md:flex">
          <Buscador id="buscar-escritorio" />
        </div>
        <nav aria-label="Principal" className="hidden gap-5 font-medium lg:flex">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} className="hover:text-rojo">
              {e.texto}
            </Link>
          ))}
        </nav>
        <details className="relative ml-auto lg:hidden">
          <summary className="border-borde flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border px-3 font-semibold">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            Menú
          </summary>
          <div className="bg-tarjeta border-borde absolute right-0 mt-2 flex w-72 flex-col gap-3 rounded-2xl border p-4 shadow-lg">
            <Buscador id="buscar-celular" />
            <nav aria-label="Principal" className="flex flex-col">
              {ENLACES.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="hover:bg-campo flex min-h-11 items-center rounded-lg px-2 font-medium"
                >
                  {e.texto}
                </Link>
              ))}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
