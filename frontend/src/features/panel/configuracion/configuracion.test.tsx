import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { PaginaConfiguracion } from "./PaginaConfiguracion";

prepararServidor();

const CONFIG = {
  nombre: "Garaje Ruta",
  logo_public_id: "",
  whatsapp: "50688887777",
  direccion: "Heredia, Costa Rica",
  mapa_url: "",
  horarios: [
    { dia_semana: 0, apertura: "08:00", cierre: "17:00" },
    { dia_semana: 5, apertura: "08:00", cierre: "12:00" },
  ],
};

const obtener = () => http.get("*/api/v1/panel/configuracion/", () => HttpResponse.json(CONFIG));

describe("configuración del negocio", () => {
  it("carga los datos y guarda con PUT incluyendo los horarios", async () => {
    const u = userEvent.setup();
    let cuerpo: Record<string, unknown> | undefined;
    servidor.use(
      obtener(),
      http.put("*/api/v1/panel/configuracion/", async ({ request }) => {
        cuerpo = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(cuerpo);
      }),
    );
    renderPanel(<PaginaConfiguracion />);
    const direccion = await screen.findByLabelText("Dirección");
    expect(direccion).toHaveValue("Heredia, Costa Rica");
    await u.clear(direccion);
    await u.type(direccion, "Barva, Heredia");
    await u.click(screen.getByRole("button", { name: "Agregar horario" }));
    const nuevo = screen.getByRole("group", { name: "Horario 3" });
    await u.selectOptions(within(nuevo).getByLabelText("Día"), "6");
    await u.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(cuerpo).toBeDefined());
    expect(cuerpo).toMatchObject({
      direccion: "Barva, Heredia",
      whatsapp: "50688887777",
      horarios: [
        { dia_semana: 0, apertura: "08:00", cierre: "17:00" },
        { dia_semana: 5, apertura: "08:00", cierre: "12:00" },
        { dia_semana: 6, apertura: "08:00", cierre: "17:00" },
      ],
    });
    expect(await screen.findByText("Datos del negocio guardados.")).toBeInTheDocument();
  });

  it("el botón Guardar está arriba, antes de los campos", async () => {
    servidor.use(obtener());
    renderPanel(<PaginaConfiguracion />);
    const nombre = await screen.findByLabelText("Nombre del negocio");
    const guardar = screen.getByRole("button", { name: "Guardar" });
    expect(guardar.compareDocumentPosition(nombre) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("un WhatsApp con guiones o espacios se rechaza antes de enviar", async () => {
    const u = userEvent.setup();
    let enviado = false;
    servidor.use(
      obtener(),
      http.put("*/api/v1/panel/configuracion/", () => {
        enviado = true;
        return HttpResponse.json(CONFIG);
      }),
    );
    renderPanel(<PaginaConfiguracion />);
    const whatsapp = await screen.findByLabelText("WhatsApp");
    await u.clear(whatsapp);
    await u.type(whatsapp, "8888-7777");
    await u.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText(/Solo dígitos, con el código de país/)).toBeInTheDocument();
    expect(enviado).toBe(false);
  });

  it("el cierre tiene que ser después de la apertura", async () => {
    const u = userEvent.setup();
    servidor.use(obtener());
    renderPanel(<PaginaConfiguracion />);
    const primero = await screen.findByRole("group", { name: "Horario 1" });
    const cierre = within(primero).getByLabelText("Cierra");
    await u.clear(cierre);
    await u.type(cierre, "07:00");
    await u.click(screen.getByRole("button", { name: "Guardar" }));
    expect(
      await within(primero).findByText("Tiene que ser después de la apertura."),
    ).toBeInTheDocument();
  });

  it("sin permiso de editar se ve en solo lectura", async () => {
    servidor.use(obtener());
    renderPanel(<PaginaConfiguracion />, { usuario: "demo" });
    expect(await screen.findByLabelText("Dirección")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
  });
});
