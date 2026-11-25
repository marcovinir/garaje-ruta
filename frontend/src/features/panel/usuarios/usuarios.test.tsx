import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";

import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { PaginaUsuarios } from "./PaginaUsuarios";
import type { UsuarioPanel } from "./api";

prepararServidor();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

const usuario = (u: Partial<UsuarioPanel> & Pick<UsuarioPanel, "id" | "nombre">): UsuarioPanel => ({
  email: `${u.nombre.toLowerCase()}@garajeruta.test`,
  apellidos: "Prueba",
  rol: "colaborador",
  is_active: true,
  activado: true,
  creado_en: "2026-11-01T10:00:00-06:00",
  ...u,
});

// El admin de la sesión de prueba tiene id 1 (src/test/datos.ts).
const USUARIOS = [
  usuario({ id: 1, nombre: "Ana", rol: "admin" }),
  usuario({ id: 2, nombre: "Carlos" }),
  // Como en Django: un invitado nace con is_active=False hasta activar su cuenta.
  usuario({ id: 4, nombre: "Lucía", activado: false, is_active: false }),
  usuario({ id: 5, nombre: "Pedro", is_active: false }),
];

function listar(lista = USUARIOS) {
  return http.get("*/api/v1/panel/usuarios/", () =>
    HttpResponse.json({ count: lista.length, next: null, previous: null, results: lista }),
  );
}

const fila = (nombre: string) => screen.findByRole("article", { name: new RegExp(nombre) });

describe("usuarios", () => {
  it("muestra cada usuario con su rol y su estado", async () => {
    servidor.use(listar());
    renderPanel(<PaginaUsuarios />);
    expect(within(await fila("Carlos")).getByText("Activo")).toBeInTheDocument();
    expect(within(await fila("Lucía")).getByText("Pendiente de activar")).toBeInTheDocument();
    expect(within(await fila("Pedro")).getByText("Desactivado")).toBeInTheDocument();
    expect(within(await fila("Ana")).getByText("Administración")).toBeInTheDocument();
  });

  it("crear un usuario lo agrega como pendiente de activar", async () => {
    const u = userEvent.setup();
    let cuerpo: unknown;
    let creado = false;
    const nueva = usuario({
      id: 9,
      nombre: "Sofía",
      activado: false,
      is_active: false,
      email: "sofia@x.test",
    });
    servidor.use(
      http.get("*/api/v1/panel/usuarios/", () => {
        const lista = creado ? [...USUARIOS, nueva] : USUARIOS;
        return HttpResponse.json({
          count: lista.length,
          next: null,
          previous: null,
          results: lista,
        });
      }),
      http.post("*/api/v1/panel/usuarios/", async ({ request }) => {
        cuerpo = await request.json();
        creado = true;
        return HttpResponse.json(nueva, { status: 201 });
      }),
    );
    renderPanel(<PaginaUsuarios />);
    await u.click(await screen.findByRole("button", { name: "Nuevo usuario" }));
    const dialogo = screen.getByRole("dialog", { name: "Nuevo usuario" });
    await u.type(within(dialogo).getByLabelText("Correo"), "sofia@x.test");
    await u.type(within(dialogo).getByLabelText("Nombre"), "Sofía");
    await u.type(within(dialogo).getByLabelText("Apellidos"), "Mora");
    await u.selectOptions(within(dialogo).getByLabelText("Rol"), "colaborador");
    await u.click(within(dialogo).getByRole("button", { name: "Crear y enviar invitación" }));
    expect(within(await fila("Sofía")).getByText("Pendiente de activar")).toBeInTheDocument();
    expect(cuerpo).toEqual({
      email: "sofia@x.test",
      nombre: "Sofía",
      apellidos: "Mora",
      rol: "colaborador",
    });
  });

  it("un correo repetido muestra el error junto al campo", async () => {
    const u = userEvent.setup();
    servidor.use(
      listar(),
      http.post("*/api/v1/panel/usuarios/", () =>
        HttpResponse.json(
          {
            detalle: "Revisá los datos.",
            campos: { email: ["Ya existe un usuario con ese correo."] },
          },
          { status: 400 },
        ),
      ),
    );
    renderPanel(<PaginaUsuarios />);
    await u.click(await screen.findByRole("button", { name: "Nuevo usuario" }));
    const dialogo = screen.getByRole("dialog", { name: "Nuevo usuario" });
    await u.type(within(dialogo).getByLabelText("Correo"), "carlos@garajeruta.test");
    await u.type(within(dialogo).getByLabelText("Nombre"), "Carlos");
    await u.type(within(dialogo).getByLabelText("Apellidos"), "Otro");
    await u.click(within(dialogo).getByRole("button", { name: "Crear y enviar invitación" }));
    expect(
      await within(dialogo).findByText("Ya existe un usuario con ese correo."),
    ).toBeInTheDocument();
    expect(within(dialogo).getByLabelText("Correo")).toHaveAttribute("aria-invalid", "true");
  });

  it("desactivar pide confirmación y el propio usuario no puede desactivarse", async () => {
    const u = userEvent.setup();
    let desactivado = false;
    servidor.use(
      listar(),
      http.post("*/api/v1/panel/usuarios/2/desactivar/", () => {
        desactivado = true;
        return HttpResponse.json({ ...USUARIOS[1], is_active: false });
      }),
    );
    renderPanel(<PaginaUsuarios />);
    expect(
      within(await fila("Ana")).queryByRole("button", { name: "Desactivar" }),
    ).not.toBeInTheDocument();
    await u.click(within(await fila("Carlos")).getByRole("button", { name: "Desactivar" }));
    const dialogo = screen.getByRole("dialog", { name: "¿Desactivar a Carlos Prueba?" });
    expect(desactivado).toBe(false);
    await u.click(within(dialogo).getByRole("button", { name: "Desactivar" }));
    await waitFor(() => expect(desactivado).toBe(true));
    expect(within(await fila("Carlos")).getByText("Desactivado")).toBeInTheDocument();
  });

  it("el rechazo de Django (último admin) se muestra", async () => {
    const u = userEvent.setup();
    servidor.use(
      listar(),
      http.post("*/api/v1/panel/usuarios/2/desactivar/", () =>
        HttpResponse.json(
          { detalle: "Debe quedar al menos un administrador activo." },
          { status: 400 },
        ),
      ),
    );
    renderPanel(<PaginaUsuarios />);
    await u.click(within(await fila("Carlos")).getByRole("button", { name: "Desactivar" }));
    await u.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Desactivar" }));
    expect(
      await screen.findByText("Debe quedar al menos un administrador activo."),
    ).toBeInTheDocument();
  });

  it("reenvía la invitación solo a quien no activó y reactiva a los desactivados", async () => {
    servidor.use(listar());
    renderPanel(<PaginaUsuarios />);
    expect(
      within(await fila("Lucía")).getByRole("button", { name: "Reenviar invitación" }),
    ).toBeInTheDocument();
    expect(
      within(await fila("Lucía")).queryByRole("button", { name: "Reactivar" }),
    ).not.toBeInTheDocument();
    expect(
      within(await fila("Carlos")).queryByRole("button", { name: "Reenviar invitación" }),
    ).not.toBeInTheDocument();
    expect(
      within(await fila("Pedro")).getByRole("button", { name: "Reactivar" }),
    ).toBeInTheDocument();
  });

  it("el colaborador no tiene acceso", async () => {
    renderPanel(<PaginaUsuarios />, { usuario: "colaborador" });
    expect(await screen.findByText("No tenés acceso a esta sección")).toBeInTheDocument();
  });
});
