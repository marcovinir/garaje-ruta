import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import type { Configuracion } from "@/shared/api/tipos";
import { PieDePagina } from "../componentes/PieDePagina";
import { Contacto } from "./Contacto";

const negocio: Configuracion = {
  nombre: "Garaje Ruta",
  direccion: "Heredia, Costa Rica",
  mapa_url: "",
  whatsapp: "",
  logo_public_id: "",
  horarios: [],
};

it("muestra el aviso de portafolio y oculta bloques vacíos", () => {
  render(<Contacto configuracion={{ ...negocio, metodos_pago: "   " }} />);
  expect(screen.getByText(/Negocio ficticio de portafolio/)).toBeVisible();
  for (const name of [
    "Horario",
    "Métodos de pago",
    "Preguntas frecuentes",
    "Redes sociales",
    "Condiciones de compra",
    "Devoluciones",
    "Métodos de entrega",
    "Garantía de repuestos",
  ]) {
    expect(screen.queryByRole("heading", { name })).not.toBeInTheDocument();
  }
  expect(screen.queryByRole("link", { name: /WhatsApp/ })).not.toBeInTheDocument();
});

it("reutiliza horarios, políticas y enlaces configurados", () => {
  render(
    <Contacto
      configuracion={{
        ...negocio,
        whatsapp: "50600000000",
        mapa_url: "https://mapa.example/heredia",
        horarios: [{ dia_semana: 0, apertura: "08:00", cierre: "17:00" }],
        metodos_pago: "Transferencia",
        redes_sociales: [{ red: "Red del negocio", url: "https://social.example/perfil" }],
      }}
    />,
  );
  expect(screen.getByText("Transferencia")).toBeVisible();
  expect(screen.getByText("Lunes · 08:00 a 17:00")).toBeVisible();
  expect(screen.getByRole("link", { name: "Cómo llegar" })).toHaveAttribute(
    "href",
    "https://mapa.example/heredia",
  );
  expect(screen.getByRole("link", { name: "Escribinos por WhatsApp" })).toHaveAttribute(
    "href",
    expect.stringContaining("wa.me/50600000000"),
  );
  const red = screen.getByRole("link", { name: "Red del negocio" });
  expect(red).toHaveAttribute("href", "https://social.example/perfil");
  expect(red).toHaveAttribute("target", "_blank");
  expect(red).toHaveAttribute("rel", "noopener noreferrer");
});

it("las preguntas reciben foco en orden y se abren y cierran", async () => {
  const u = userEvent.setup();
  render(
    <Contacto
      configuracion={{
        ...negocio,
        preguntas_frecuentes: [
          { pregunta: "¿Cómo consulto?", respuesta: "Escribinos." },
          { pregunta: "¿Cómo llego?", respuesta: "Consultá el mapa." },
        ],
      }}
    />,
  );
  const primera = screen.getByText("¿Cómo consulto?");
  await u.tab();
  expect(primera).toHaveFocus();
  await u.click(primera);
  expect(primera.closest("details")).toHaveAttribute("open");
  await u.click(primera);
  expect(primera.closest("details")).not.toHaveAttribute("open");
  await u.tab();
  expect(screen.getByText("¿Cómo llego?")).toHaveFocus();
});

it("conserva el ancla del pie y suma el enlace a la página de contacto", () => {
  render(<PieDePagina configuracion={null} />);
  expect(screen.getByRole("contentinfo")).toHaveAttribute("id", "contacto");
  expect(screen.getByRole("link", { name: "Contacto y confianza" })).toHaveAttribute(
    "href",
    "/contacto",
  );
});
