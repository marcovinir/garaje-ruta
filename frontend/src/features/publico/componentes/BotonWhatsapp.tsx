import { enlaceWhatsapp } from "@/shared/lib/whatsapp";

type Props = {
  numero: string;
  titulo: string;
  url: string;
  texto?: string;
  className?: string;
};

export function IconoWhatsapp() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3z" />
    </svg>
  );
}

export function BotonWhatsapp({
  numero,
  titulo,
  url,
  texto = "Consultar por WhatsApp",
  className = "",
}: Props) {
  return (
    <a
      href={enlaceWhatsapp(numero, titulo, url)}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-rojo hover:bg-rojo-oscuro flex min-h-13 items-center justify-center gap-2.5 rounded-xl px-5 font-bold text-white ${className}`}
    >
      <IconoWhatsapp />
      {texto}
    </a>
  );
}
