import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Compartir } from "./Compartir";
import { ContadorVistas } from "./ContadorVistas";
import { Galeria } from "./Galeria";

const fotos = [1, 2, 3].map((n) => ({ public_id: `f${n}`, ancho: 1600, alto: 1200 }));

describe("Galeria", () => {
  it("cambia de foto con los botones de miniatura y con las flechas del teclado", async () => {
    const usuario = userEvent.setup();
    render(<Galeria fotos={fotos} titulo="Kia Rio" />);
    const actual = () => screen.getByText(/^\d de 3$/);
    expect(actual()).toHaveTextContent("1 de 3");

    await usuario.click(screen.getByRole("button", { name: "Foto 2 de 3" }));
    expect(screen.getByRole("button", { name: "Foto 2 de 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(actual()).toHaveTextContent("2 de 3");

    screen.getByRole("region", { name: "Fotos de Kia Rio" }).focus();
    await usuario.keyboard("{ArrowRight}");
    expect(actual()).toHaveTextContent("3 de 3");
    await usuario.keyboard("{ArrowRight}");
    expect(actual()).toHaveTextContent("3 de 3");
    await usuario.keyboard("{ArrowLeft}");
    expect(actual()).toHaveTextContent("2 de 3");
  });

  it("cada foto tiene texto alternativo", () => {
    render(<Galeria fotos={fotos} titulo="Kia Rio" />);
    expect(screen.getByAltText("Kia Rio, foto 1 de 3")).toBeInTheDocument();
  });

  it("sin fotos muestra la imagen pendiente y no muestra controles", () => {
    render(<Galeria fotos={[]} titulo="Kia Rio" />);
    expect(screen.getByAltText("Kia Rio")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Compartir", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sin navigator.share copia el enlace y lo anuncia", async () => {
    const usuario = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<Compartir titulo="Kia Rio" url="https://garaje.example/autos/kia-rio-2018-3" />);
    await usuario.click(screen.getByRole("button", { name: "Compartir" }));
    expect(writeText).toHaveBeenCalledWith("https://garaje.example/autos/kia-rio-2018-3");
    expect(screen.getByRole("status")).toHaveTextContent("Enlace copiado");
  });

  it("con navigator.share usa el menú del teléfono", async () => {
    const usuario = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    render(<Compartir titulo="Kia Rio" url="https://garaje.example/autos/kia-rio-2018-3" />);
    await usuario.click(screen.getByRole("button", { name: "Compartir" }));
    expect(share).toHaveBeenCalledWith({
      title: "Kia Rio",
      url: "https://garaje.example/autos/kia-rio-2018-3",
    });
  });
});

describe("ContadorVistas", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("registra una sola vista por artículo y sesión", () => {
    const { unmount } = render(<ContadorVistas id={7} />);
    unmount();
    render(<ContadorVistas id={7} />);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/v1/vistas/7", { method: "POST", keepalive: true });
  });
});
