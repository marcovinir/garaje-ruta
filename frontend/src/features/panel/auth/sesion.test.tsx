import { useQuery } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { api } from "@/shared/api/navegador";
import { yoDe } from "@/test/datos";
import { irA, router } from "@/test/navegacion";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor, sesion } from "@/test/servidor";

import { GuardiaSesion } from "../estructura/GuardiaSesion";
import { PaginaContrasena } from "./PaginaContrasena";
import { PaginaLogin } from "./PaginaLogin";
import { PaginaRecuperar } from "./PaginaRecuperar";

prepararServidor();

async function ingresar(correo = "admin@garajeruta.test", clave = "Local-Garaje-2026") {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Correo"), correo);
  await usuario.type(screen.getByLabelText("Contraseña"), clave);
  await usuario.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("acceso al panel", () => {
  it("sin sesión, una página protegida lleva al login con «siguiente»", async () => {
    irA("/panel/articulos", "estado=vendido");
    renderPanel(
      <GuardiaSesion>
        <p>contenido</p>
      </GuardiaSesion>,
      { usuario: null },
    );
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        `/panel/login?siguiente=${encodeURIComponent("/panel/articulos?estado=vendido")}`,
      ),
    );
    expect(screen.queryByText("contenido")).not.toBeInTheDocument();
  });

  it("con sesión muestra el contenido dentro del marco del panel", async () => {
    renderPanel(
      <GuardiaSesion>
        <p>contenido</p>
      </GuardiaSesion>,
    );
    expect(await screen.findByText("contenido")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Panel" }).length).toBeGreaterThan(0);
  });

  it("el login correcto vuelve a «siguiente»", async () => {
    irA("/panel/login", `siguiente=${encodeURIComponent("/panel/articulos?tipo=auto")}`);
    servidor.use(http.post("*/api/v1/auth/login/", () => HttpResponse.json(yoDe("admin"))));
    renderPanel(<PaginaLogin />, { usuario: null });
    await ingresar();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/panel/articulos?tipo=auto"));
  });

  it("un «siguiente» de otro sitio se ignora (sin redirección abierta)", async () => {
    irA("/panel/login", "siguiente=https://otro.sitio/robo");
    servidor.use(http.post("*/api/v1/auth/login/", () => HttpResponse.json(yoDe("admin"))));
    renderPanel(<PaginaLogin />, { usuario: null });
    await ingresar();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/panel/articulos"));
  });

  it("credenciales malas muestran el mensaje de Django", async () => {
    irA("/panel/login");
    servidor.use(
      http.post("*/api/v1/auth/login/", () =>
        HttpResponse.json({ detalle: "Correo o contraseña incorrectos." }, { status: 400 }),
      ),
    );
    renderPanel(<PaginaLogin />, { usuario: null });
    await ingresar("admin@garajeruta.test", "mala");
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
  });

  it("demasiados intentos (429) lo dice claro", async () => {
    irA("/panel/login");
    servidor.use(
      http.post("*/api/v1/auth/login/", () =>
        HttpResponse.json({ detalle: "Request was throttled." }, { status: 429 }),
      ),
    );
    renderPanel(<PaginaLogin />, { usuario: null });
    await ingresar();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demasiados intentos. Esperá un minuto y probá de nuevo.",
    );
  });

  it("si la sesión vence en medio del trabajo, avisa y lleva al login (Review Focus 1)", async () => {
    irA("/panel/articulos/12");
    function Consulta() {
      useQuery({ queryKey: ["x"], queryFn: () => api("/panel/articulos/12/") });
      return null;
    }
    servidor.use(
      http.get("*/api/v1/panel/articulos/12/", () =>
        HttpResponse.json({ detalle: "Las credenciales no se proveyeron." }, { status: 403 }),
      ),
    );
    renderPanel(<Consulta />, { usuario: null });
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        `/panel/login?motivo=sesion&siguiente=${encodeURIComponent("/panel/articulos/12")}`,
      ),
    );
  });

  it("el login dice que la sesión terminó cuando viene de ahí", async () => {
    irA("/panel/login", "motivo=sesion");
    renderPanel(<PaginaLogin />, { usuario: null });
    expect(await screen.findByText("Tu sesión terminó. Entrá de nuevo.")).toBeInTheDocument();
  });

  it("un 403 por permiso con la sesión viva no saca al usuario", async () => {
    irA("/panel/usuarios");
    function Consulta() {
      useQuery({ queryKey: ["u"], queryFn: () => api("/panel/usuarios/") });
      return null;
    }
    servidor.use(
      http.get("*/api/v1/panel/usuarios/", () =>
        HttpResponse.json({ detalle: "No tenés permiso." }, { status: 403 }),
      ),
    );
    renderPanel(<Consulta />, { usuario: "demo" });
    await new Promise((r) => setTimeout(r, 50));
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("contraseñas", () => {
  it("activar con contraseñas distintas no envía nada", async () => {
    const usuario = userEvent.setup();
    renderPanel(<PaginaContrasena modo="activar" uid="MQ" token="abc" />, { usuario: null });
    await usuario.type(screen.getByLabelText("Contraseña nueva"), "Garaje-Nueva-2026");
    await usuario.type(screen.getByLabelText("Repetir la contraseña"), "Otra-Cosa-2026");
    await usuario.click(screen.getByRole("button", { name: "Activar mi cuenta" }));
    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  });

  it("un enlace vencido explica cómo seguir", async () => {
    const usuario = userEvent.setup();
    servidor.use(
      http.post("*/api/v1/auth/restablecer/", () =>
        HttpResponse.json({ detalle: "El enlace no es válido o ya fue usado." }, { status: 400 }),
      ),
    );
    renderPanel(<PaginaContrasena modo="restablecer" uid="MQ" token="viejo" />, { usuario: null });
    await usuario.type(screen.getByLabelText("Contraseña nueva"), "Garaje-Nueva-2026");
    await usuario.type(screen.getByLabelText("Repetir la contraseña"), "Garaje-Nueva-2026");
    await usuario.click(screen.getByRole("button", { name: "Guardar contraseña" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El enlace no es válido");
    expect(screen.getByRole("link", { name: "Pedir un enlace nuevo" })).toHaveAttribute(
      "href",
      "/panel/recuperar",
    );
  });

  it("recuperar responde lo mismo exista o no el correo", async () => {
    const usuario = userEvent.setup();
    servidor.use(
      http.post("*/api/v1/auth/recuperar/", () => new HttpResponse(null, { status: 204 })),
    );
    renderPanel(<PaginaRecuperar />, { usuario: null });
    await usuario.type(screen.getByLabelText("Correo"), "nadie@x.test");
    await usuario.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(
      await screen.findByText(/Si el correo está registrado, te llegará un enlace/),
    ).toBeInTheDocument();
  });
});

describe("sesion por defecto", () => {
  it("el servidor de prueba arranca con admin", () => {
    expect(sesion.rol).toBe("admin");
  });
});
