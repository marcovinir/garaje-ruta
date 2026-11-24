import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";

import { CATALOGOS } from "@/test/datos";
import { irA, router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor, sesion } from "@/test/servidor";

import { PaginaEditar } from "./PaginaEditar";
import { PaginaNuevo } from "./PaginaNuevo";
import type { DetallePanel } from "./tipos";

prepararServidor();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

type Usuario = ReturnType<typeof userEvent.setup>;

async function llenarAuto(u: Usuario) {
  await u.type(await screen.findByLabelText("Título"), "Toyota Corolla 2015");
  await u.type(screen.getByLabelText("Precio (₡)"), "6500000");
  await u.selectOptions(screen.getByLabelText("Marca"), "13");
  await u.selectOptions(screen.getByLabelText("Modelo"), "40");
  await u.type(screen.getByLabelText("Año"), "2015");
  await u.type(screen.getByLabelText("Kilometraje"), "82000");
  await u.selectOptions(screen.getByLabelText("Transmisión"), "2");
  await u.selectOptions(screen.getByLabelText("Combustible"), "1");
  await u.selectOptions(screen.getByLabelText("Tracción"), "1");
  await u.selectOptions(screen.getByLabelText("Carrocería"), "1");
  await u.type(screen.getByLabelText("Color exterior"), "Blanco");
  await u.click(screen.getByLabelText("Aire acondicionado"));
}

const guardar = (u: Usuario) => u.click(screen.getByRole("button", { name: "Guardar" }));

const DETALLE: DetallePanel = {
  id: 101,
  tipo: "auto",
  titulo: "Toyota Corolla 2015",
  descripcion: "Muy cuidado.",
  precio_colones: 6500000,
  precio_anterior_colones: null,
  destacado: false,
  estado: "disponible",
  publicado_en: "2026-11-01T10:00:00-06:00",
  actualizado_en: "2026-11-01T10:00:00-06:00",
  fotos: [],
  auto: {
    modelo: 40,
    anio: 2015,
    version: "",
    kilometraje: 82000,
    transmision: 2,
    combustible: 1,
    traccion: 1,
    carroceria: 1,
    color_exterior: "Blanco",
    color_interior: "",
    cilindrada_cc: null,
    puertas: 4,
    pasajeros: 5,
    bolsas_aire: 2,
    unico_dueno: false,
    procedencia: "agencia",
    marchamo_al_dia: true,
    riteve_vence: null,
    impuestos_pagados: true,
    acepta_vehiculo: false,
    precio_negociable: false,
    estado_general: "bueno",
    placa_termina_en: null,
    equipamiento: [1],
  },
  repuesto: null,
};

describe("formulario de artículos", () => {
  it("crear un auto manda ids de catálogo y vuelve al listado", async () => {
    const u = userEvent.setup();
    let cuerpo: Record<string, unknown> = {};
    servidor.use(
      http.post("*/api/v1/panel/articulos/", async ({ request }) => {
        cuerpo = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...DETALLE, id: 500 }, { status: 201 });
      }),
    );
    irA("/panel/articulos/nuevo", "tipo=auto");
    renderPanel(<PaginaNuevo />);
    await llenarAuto(u);
    await guardar(u);
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/panel/articulos"));
    expect(cuerpo).toMatchObject({
      tipo: "auto",
      titulo: "Toyota Corolla 2015",
      precio_colones: 6500000,
      auto: { modelo: 40, anio: 2015, transmision: 2, equipamiento: [1] },
    });
    expect(await screen.findByText("Guardado: Toyota Corolla 2015")).toBeInTheDocument();
  });

  it("un error de Django en un campo anidado aparece junto a ese campo", async () => {
    const u = userEvent.setup();
    servidor.use(
      http.post("*/api/v1/panel/articulos/", () =>
        HttpResponse.json(
          {
            detalle: "Revisá los datos.",
            campos: { auto: { anio: ["El año no puede ser futuro."] } },
          },
          { status: 400 },
        ),
      ),
    );
    irA("/panel/articulos/nuevo", "tipo=auto");
    renderPanel(<PaginaNuevo />);
    await llenarAuto(u);
    await guardar(u);
    const anio = screen.getByLabelText("Año");
    expect(await screen.findByText("El año no puede ser futuro.")).toBeInTheDocument();
    expect(anio).toHaveAttribute("aria-invalid", "true");
  });

  it("precio anterior menor o igual al precio: error antes de enviar", async () => {
    const u = userEvent.setup();
    let enviado = false;
    servidor.use(
      http.post("*/api/v1/panel/articulos/", () => {
        enviado = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    irA("/panel/articulos/nuevo", "tipo=auto");
    renderPanel(<PaginaNuevo />);
    await llenarAuto(u);
    await u.type(screen.getByLabelText("Precio anterior (₡)"), "6000000");
    await guardar(u);
    expect(
      await screen.findByText("Tiene que ser mayor que el precio actual."),
    ).toBeInTheDocument();
    expect(enviado).toBe(false);
  });

  it("un repuesto sin compatibilidades no se envía", async () => {
    const u = userEvent.setup();
    irA("/panel/articulos/nuevo", "tipo=repuesto");
    renderPanel(<PaginaNuevo />);
    await u.click(await screen.findByRole("button", { name: "Quitar la compatibilidad 1" }));
    await guardar(u);
    expect(await screen.findByText("Agregá al menos una compatibilidad.")).toBeInTheDocument();
  });

  it("cambiar la marca limpia el modelo", async () => {
    const u = userEvent.setup();
    irA("/panel/articulos/nuevo", "tipo=auto");
    renderPanel(<PaginaNuevo />);
    await u.selectOptions(await screen.findByLabelText("Marca"), "13");
    await u.selectOptions(screen.getByLabelText("Modelo"), "40");
    await u.selectOptions(screen.getByLabelText("Marca"), "15");
    expect(screen.getByLabelText("Modelo")).toHaveValue("");
    expect(
      within(screen.getByLabelText("Modelo")).getByRole("option", { name: "Sentra" }),
    ).toBeInTheDocument();
  });

  it("editar carga el artículo y manda PATCH solo con lo que cambió", async () => {
    const u = userEvent.setup();
    let metodo = "";
    let cuerpo: unknown;
    servidor.use(
      http.get("*/api/v1/panel/articulos/101/", () => HttpResponse.json(DETALLE)),
      http.patch("*/api/v1/panel/articulos/101/", async ({ request }) => {
        metodo = request.method;
        cuerpo = await request.json();
        return HttpResponse.json(DETALLE);
      }),
    );
    renderPanel(<PaginaEditar id={101} />);
    const titulo = await screen.findByLabelText("Título");
    expect(titulo).toHaveValue("Toyota Corolla 2015");
    expect(screen.getByLabelText("Marca")).toHaveValue("13");
    await u.clear(titulo);
    await u.type(titulo, "Toyota Corolla 2015 SE");
    await guardar(u);
    await waitFor(() => expect(metodo).toBe("PATCH"));
    expect(cuerpo).toEqual({ titulo: "Toyota Corolla 2015 SE" });
  });

  it("«+ Agregar marca» crea la marca y la deja elegida", async () => {
    const u = userEvent.setup();
    let creada = false;
    servidor.use(
      http.post("*/api/v1/panel/marcas/", async ({ request }) => {
        creada = true;
        return HttpResponse.json(
          { id: 99, ...((await request.json()) as object), slug: "byd" },
          { status: 201 },
        );
      }),
      http.get("*/api/v1/catalogos/", () =>
        HttpResponse.json(
          creada
            ? {
                ...CATALOGOS,
                marcas: [...CATALOGOS.marcas, { id: 99, nombre: "BYD", slug: "byd", modelos: [] }],
              }
            : CATALOGOS,
        ),
      ),
    );
    irA("/panel/articulos/nuevo", "tipo=auto");
    renderPanel(<PaginaNuevo />, { usuario: "colaborador" });
    await u.click(await screen.findByRole("button", { name: "Agregar marca" }));
    const dialogo = screen.getByRole("dialog", { name: "Agregar marca" });
    await u.type(within(dialogo).getByLabelText("Nombre"), "BYD");
    await u.click(within(dialogo).getByRole("button", { name: "Agregar" }));
    await waitFor(() => expect(screen.getByLabelText("Marca")).toHaveValue("99"));
  });

  it("el demo no llega al formulario (Review Focus 4)", async () => {
    irA("/panel/articulos/nuevo", "tipo=auto");
    renderPanel(<PaginaNuevo />, { usuario: "demo" });
    expect(await screen.findByText("No tenés acceso a esta sección")).toBeInTheDocument();
  });

  it("sin tipo en la URL pregunta qué se va a publicar", async () => {
    irA("/panel/articulos/nuevo");
    renderPanel(<PaginaNuevo />);
    expect(await screen.findByRole("link", { name: /Un auto/ })).toHaveAttribute(
      "href",
      "/panel/articulos/nuevo?tipo=auto",
    );
  });

  it("si la sesión venció al guardar, lleva al login (Review Focus 1)", async () => {
    const u = userEvent.setup();
    servidor.use(
      http.post("*/api/v1/panel/articulos/", () => {
        sesion.rol = null;
        return HttpResponse.json(
          { detalle: "Las credenciales no se proveyeron." },
          { status: 403 },
        );
      }),
    );
    irA("/panel/articulos/nuevo", "tipo=auto");
    renderPanel(<PaginaNuevo />);
    await llenarAuto(u);
    await guardar(u);
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        `/panel/login?motivo=sesion&siguiente=${encodeURIComponent("/panel/articulos/nuevo?tipo=auto")}`,
      ),
    );
  });
});
