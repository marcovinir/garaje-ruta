import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";

import type { FotoApi } from "@/shared/api/tipos";
import { renderPanel } from "@/test/render";
import { prepararServidor, servidor } from "@/test/servidor";

import { ErrorFoto } from "./comprimir";
import { EditorFotos } from "./EditorFotos";
import { type DependenciasFotos, useFotos } from "./useFotos";

prepararServidor();

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

type Diferida = { resolver: (f: FotoApi) => void; rechazar: (e: Error) => void };

function dependenciasControladas() {
  const pendientes: Diferida[] = [];
  let activas = 0;
  let maximo = 0;
  const deps: DependenciasFotos = {
    comprimir: async () => ({ blob: new Blob(["x"]), ancho: 2000, alto: 1500 }),
    firmar: async () => ({
      cloud_name: "garaje",
      api_key: "1",
      timestamp: 1,
      folder: "garaje-ruta/articulos",
      signature: "s",
    }),
    subir: () => {
      activas++;
      maximo = Math.max(maximo, activas);
      return new Promise<FotoApi>((resolver, rechazar) => {
        pendientes.push({
          resolver: (f) => {
            activas--;
            resolver(f);
          },
          rechazar: (e) => {
            activas--;
            rechazar(e);
          },
        });
      });
    },
  };
  return { deps, pendientes, maximo: () => maximo };
}

const archivos = (n: number) =>
  Array.from({ length: n }, (_, i) => new File(["x"], `foto-${i + 1}.jpg`, { type: "image/jpeg" }));

const foto = (n: number): FotoApi => ({
  public_id: `garaje-ruta/articulos/f${n}`,
  ancho: 2000,
  alto: 1500,
});

function Prueba({
  deps,
  iniciales = [],
}: {
  deps: Partial<DependenciasFotos>;
  iniciales?: FotoApi[];
}) {
  const fotos = useFotos(iniciales, deps);
  return (
    <>
      <EditorFotos fotos={fotos} />
      <output aria-label="orden">
        {fotos
          .listas()
          .map((f) => f.public_id)
          .join(",")}
      </output>
      <output aria-label="ocupado">{String(fotos.ocupado)}</output>
    </>
  );
}

async function elegir(n: number) {
  const entrada = screen.getByLabelText("Elegir de la galería");
  await userEvent.setup().upload(entrada, archivos(n));
}

describe("editor de fotos", () => {
  it("sube como máximo 3 a la vez y sigue con la cola (§8)", async () => {
    const c = dependenciasControladas();
    renderPanel(<Prueba deps={c.deps} />);
    await elegir(5);
    await waitFor(() => expect(c.pendientes).toHaveLength(3));
    expect(screen.getByLabelText("ocupado")).toHaveTextContent("true");
    await act(async () => c.pendientes[0].resolver(foto(1)));
    await waitFor(() => expect(c.pendientes).toHaveLength(4));
    await act(async () => c.pendientes.slice(1).forEach((p, i) => p.resolver(foto(i + 2))));
    await waitFor(() => expect(c.pendientes).toHaveLength(5));
    await act(async () => c.pendientes[4].resolver(foto(5)));
    await waitFor(() => expect(screen.getByLabelText("ocupado")).toHaveTextContent("false"));
    expect(c.maximo()).toBe(3);
    expect(screen.getByText("5 de 15")).toBeInTheDocument();
  });

  it("la foto 16 se rechaza con un aviso", async () => {
    const c = dependenciasControladas();
    renderPanel(<Prueba deps={c.deps} iniciales={Array.from({ length: 14 }, (_, i) => foto(i))} />);
    await elegir(2);
    expect(await screen.findByText("Máximo 15 fotos: 1 quedó afuera.")).toBeInTheDocument();
    expect(screen.getByText("15 de 15")).toBeInTheDocument();
  });

  it("una subida que falla queda con «Reintentar» y las demás terminan (Review Focus 3)", async () => {
    const c = dependenciasControladas();
    renderPanel(<Prueba deps={c.deps} />);
    await elegir(2);
    await waitFor(() => expect(c.pendientes).toHaveLength(2));
    await act(async () => {
      c.pendientes[0].rechazar(new ErrorFoto("No se pudo subir. Revisá la conexión y reintentá."));
      c.pendientes[1].resolver(foto(2));
    });
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("No se pudo subir");
    expect(screen.getByLabelText("orden")).toHaveTextContent("garaje-ruta/articulos/f2");
    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar la foto 1" }));
    await waitFor(() => expect(c.pendientes).toHaveLength(3));
    await act(async () => c.pendientes[2].resolver(foto(1)));
    await waitFor(() =>
      expect(screen.getByLabelText("orden")).toHaveTextContent(
        "garaje-ruta/articulos/f1,garaje-ruta/articulos/f2",
      ),
    );
  });

  it("un archivo que no se puede leer queda en error sin subirse", async () => {
    const c = dependenciasControladas();
    c.deps.comprimir = async () => {
      throw new ErrorFoto("No pudimos leer esa foto. Probá con JPG o PNG.");
    };
    renderPanel(<Prueba deps={c.deps} />);
    await elegir(1);
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos leer esa foto");
    expect(c.pendientes).toHaveLength(0);
  });

  it("«Hacer principal» la pone primera y «Mover después» cambia el orden", async () => {
    const u = userEvent.setup();
    renderPanel(
      <Prueba deps={dependenciasControladas().deps} iniciales={[foto(1), foto(2), foto(3)]} />,
    );
    await u.click(screen.getByRole("button", { name: "Hacer principal la foto 3" }));
    expect(screen.getByLabelText("orden")).toHaveTextContent(
      "garaje-ruta/articulos/f3,garaje-ruta/articulos/f1,garaje-ruta/articulos/f2",
    );
    const primera = screen.getByRole("listitem", { name: "Foto 1 (principal)" });
    expect(
      within(primera).queryByRole("button", { name: /Hacer principal/ }),
    ).not.toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Mover la foto 1 después" }));
    expect(screen.getByLabelText("orden")).toHaveTextContent(
      "garaje-ruta/articulos/f1,garaje-ruta/articulos/f3,garaje-ruta/articulos/f2",
    );
  });

  it("si Cloudinary no está configurado lo dice sin romper el formulario", async () => {
    servidor.use(
      http.post("*/api/v1/panel/fotos/firma/", () =>
        HttpResponse.json({ detalle: "x" }, { status: 500 }),
      ),
    );
    const c = dependenciasControladas();
    const resto: Partial<DependenciasFotos> = { ...c.deps };
    delete resto.firmar;
    renderPanel(<Prueba deps={resto} />);
    await elegir(1);
    const avisos = await screen.findAllByText("Las fotos todavía no están configuradas.");
    expect(avisos.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Reintentar la foto 1" })).toBeInTheDocument();
  });
});
