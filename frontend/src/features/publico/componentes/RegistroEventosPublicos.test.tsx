import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { registrarEvento } from "@/shared/lib/eventos";

import { BotonWhatsapp } from "./BotonWhatsapp";
import { BotonesWhatsappFicha } from "./BotonesWhatsappFicha";
import { RegistroEventosPublicos } from "./RegistroEventosPublicos";
import { WhatsappFlotante } from "./WhatsappFlotante";

vi.mock("@/shared/lib/eventos", async (importar) => ({
  ...(await importar<typeof import("@/shared/lib/eventos")>()),
  registrarEvento: vi.fn(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/autos/corolla-17" }));

beforeEach(() => vi.clearAllMocks());

it("registra el botón genérico, las variantes de ficha y el flotante", () => {
  window.history.replaceState(null, "", "/autos/corolla-17");
  render(
    <>
      <RegistroEventosPublicos />
      <main>
        <h1>Corolla</h1>
        <BotonWhatsapp enlace="https://wa.me/50600000000" texto="Consulta general" />
        <BotonesWhatsappFicha
          tipo="auto"
          numero="50600000000"
          datos={{
            nombre: "Toyota Corolla",
            anio: 2018,
            precio: 8000000,
            url: "/autos/corolla-17",
          }}
        />
        <BotonesWhatsappFicha
          tipo="repuesto"
          numero="50600000000"
          datos={{ nombre: "Faro", precio: 35000, url: "/repuestos/faro-18" }}
          soloCompatibilidad
        />
      </main>
      <WhatsappFlotante numero="50600000000" />
    </>,
  );
  for (const name of [
    "Consulta general",
    "Consultar por WhatsApp",
    "Agendar una visita",
    "Confirmar compatibilidad",
    "Escribinos por WhatsApp",
  ]) {
    const enlace = screen.getByRole("link", { name });
    enlace.addEventListener("click", (e) => e.preventDefault(), { once: true });
    fireEvent.click(enlace);
  }
  expect(vi.mocked(registrarEvento).mock.calls.map(([tipo]) => tipo)).toEqual([
    "whatsapp_click",
    "whatsapp_click",
    "whatsapp_click",
    "visit_request",
    "whatsapp_click",
    "compatibility_request",
    "whatsapp_click",
  ]);
  expect(registrarEvento).toHaveBeenLastCalledWith("whatsapp_click", {
    articulo: 17,
    contexto: { pagina: "ficha_auto", seccion: "flotante" },
  });
  window.history.replaceState(null, "", "/");
});

it("observa solo el envío del buscador de encabezado y omite el texto buscado", () => {
  render(
    <>
      <RegistroEventosPublicos />
      <header>
        <form
          role="search"
          action="/buscar"
          aria-label="Buscador"
          onSubmit={(e) => e.preventDefault()}
        >
          <input name="q" defaultValue="texto privado" />
        </form>
      </header>
      <form
        role="search"
        action="/buscar"
        aria-label="Resultados"
        onSubmit={(e) => e.preventDefault()}
      />
    </>,
  );
  fireEvent.submit(screen.getByRole("search", { name: "Buscador" }));
  fireEvent.submit(screen.getByRole("search", { name: "Resultados" }));
  expect(registrarEvento).toHaveBeenCalledExactlyOnceWith("search_submitted", {
    contexto: { pagina: "inicio", seccion: "encabezado" },
  });
});
