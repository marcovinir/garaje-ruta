import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { irA, router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor } from "@/test/servidor";

import { Dialogo } from "../ui/Dialogo";
import { GuardiaSesion } from "./GuardiaSesion";
import { RequierePermiso } from "./RequierePermiso";

prepararServidor();

const conMarco = (hijo = <p>hola</p>) => <GuardiaSesion>{hijo}</GuardiaSesion>;

describe("marco del panel", () => {
  it("el admin ve todas las secciones; la actual lleva aria-current", async () => {
    irA("/panel/usuarios");
    renderPanel(conMarco());
    const lateral = await screen.findByRole("navigation", { name: "Panel", hidden: false });
    for (const nombre of ["Artículos", "Usuarios", "Configuración", "Catálogos"]) {
      expect(within(lateral).getByRole("link", { name: nombre })).toBeInTheDocument();
    }
    expect(within(lateral).getByRole("link", { name: "Usuarios" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("el demo no ve Usuarios ni Catálogos (Review Focus 4)", async () => {
    renderPanel(conMarco(), { usuario: "demo" });
    const lateral = await screen.findByRole("navigation", { name: "Panel" });
    expect(within(lateral).queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    expect(within(lateral).queryByRole("link", { name: "Catálogos" })).not.toBeInTheDocument();
    expect(within(lateral).getByRole("link", { name: "Configuración" })).toBeInTheDocument();
  });

  it("la navegación inferior del celular tiene nombre y ofrece «Nuevo» solo si puede crear", async () => {
    renderPanel(conMarco());
    const inferior = await screen.findByRole("navigation", { name: "Navegación del celular" });
    expect(within(inferior).getByRole("link", { name: "Artículos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(inferior).getByRole("link", { name: "Nuevo" })).toHaveAttribute(
      "href",
      "/panel/articulos/nuevo",
    );
  });

  it("«Más» solo apunta con aria-controls a su lista cuando está abierta", async () => {
    renderPanel(conMarco());
    const inferior = await screen.findByRole("navigation", { name: "Navegación del celular" });
    const mas = within(inferior).getByRole("button", { name: /Más/ });
    expect(mas).not.toHaveAttribute("aria-controls");
    await userEvent.setup().click(mas);
    expect(mas).toHaveAttribute("aria-controls", "menu-mas");
    expect(document.getElementById("menu-mas")).toBeInTheDocument();
  });

  it("el interruptor de la barra lateral cambia a modo oscuro y su nombre cambia", async () => {
    delete document.documentElement.dataset.tema;
    renderPanel(conMarco());
    const lateral = await screen.findByRole("navigation", { name: "Panel" });
    const barra = lateral.closest("aside")!;
    await userEvent
      .setup()
      .click(within(barra).getByRole("button", { name: "Cambiar a modo oscuro" }));
    expect(document.documentElement.dataset.tema).toBe("oscuro");
    expect(
      await within(barra).findByRole("button", { name: "Cambiar a modo claro" }),
    ).toBeInTheDocument();
    delete document.documentElement.dataset.tema;
  });

  it("la barra superior del celular también tiene el interruptor", async () => {
    delete document.documentElement.dataset.tema;
    renderPanel(conMarco());
    await screen.findByRole("navigation", { name: "Navegación del celular" });
    const superior = document.querySelector("header")!;
    expect(
      within(superior).getByRole("button", { name: "Cambiar a modo oscuro" }),
    ).toBeInTheDocument();
  });

  it("el demo no tiene «Nuevo» en la navegación inferior", async () => {
    renderPanel(conMarco(), { usuario: "demo" });
    const inferior = await screen.findByRole("navigation", { name: "Navegación del celular" });
    expect(within(inferior).queryByRole("link", { name: "Nuevo" })).not.toBeInTheDocument();
  });

  it("«Salir» cierra la sesión y lleva al login", async () => {
    const usuario = userEvent.setup();
    renderPanel(conMarco());
    await screen.findByRole("navigation", { name: "Panel" });
    await usuario.click(screen.getAllByRole("button", { name: "Salir" })[0]);
    expect(router.replace).toHaveBeenCalledWith("/panel/login");
  });
});

describe("permisos", () => {
  it("sin el permiso muestra «No tenés acceso a esta sección» (Review Focus 4)", async () => {
    renderPanel(
      <RequierePermiso codigo="articulos.crear">
        <p>formulario</p>
      </RequierePermiso>,
      { usuario: "demo" },
    );
    expect(await screen.findByText("No tenés acceso a esta sección")).toBeInTheDocument();
    expect(screen.queryByText("formulario")).not.toBeInTheDocument();
  });

  it("con el permiso muestra el contenido", async () => {
    renderPanel(
      <RequierePermiso codigo="articulos.crear">
        <p>formulario</p>
      </RequierePermiso>,
      { usuario: "colaborador" },
    );
    expect(await screen.findByText("formulario")).toBeInTheDocument();
  });
});

describe("Dialogo", () => {
  it("el diálogo va centrado (Tailwind le quita el margin: auto del navegador)", () => {
    renderPanel(
      <Dialogo abierto={false} titulo="¿Seguro?" alConfirmar={() => {}} alCerrar={() => {}}>
        Texto
      </Dialogo>,
    );
    expect(screen.getByRole("dialog", { hidden: true })).toHaveClass("m-auto");
  });

  it("confirma o cancela", async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    };
    const usuario = userEvent.setup();
    let confirmado = 0;
    let cerrado = 0;
    renderPanel(
      <Dialogo
        abierto
        titulo="¿Eliminar el Corolla?"
        textoConfirmar="Eliminar"
        peligroso
        alConfirmar={() => confirmado++}
        alCerrar={() => cerrado++}
      >
        No se puede deshacer.
      </Dialogo>,
    );
    const dialogo = screen.getByRole("dialog", { name: "¿Eliminar el Corolla?" });
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(cerrado).toBe(1);
    await usuario.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    expect(confirmado).toBe(1);
  });
});
