import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TemaPanel } from "./TemaPanel";
import { CLAVE_TEMA, SCRIPT_TEMA, temaInicial, useTema } from "./tema";

function sistema(oscuro: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((consulta: string) => ({
      matches: oscuro && consulta.includes("dark"),
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

function Interruptor() {
  const { tema, alternar } = useTema();
  return (
    <button type="button" onClick={alternar}>
      {tema}
    </button>
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.tema;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tema del panel", () => {
  it("sin preferencia sigue al sistema", () => {
    sistema(true);
    expect(temaInicial()).toBe("oscuro");
    sistema(false);
    expect(temaInicial()).toBe("claro");
  });

  it("la preferencia guardada manda sobre el sistema", () => {
    sistema(false);
    localStorage.setItem(CLAVE_TEMA, "oscuro");
    expect(temaInicial()).toBe("oscuro");
  });

  it("alternar guarda la elección y cambia el atributo de <html>", async () => {
    sistema(false);
    document.documentElement.dataset.tema = "claro";
    render(<Interruptor />);
    await userEvent.setup().click(screen.getByRole("button", { name: "claro" }));
    expect(document.documentElement.dataset.tema).toBe("oscuro");
    expect(localStorage.getItem(CLAVE_TEMA)).toBe("oscuro");
    expect(screen.getByRole("button", { name: "oscuro" })).toBeInTheDocument();
  });

  it("con el almacenamiento roto sigue al sistema y alternar igual cambia el modo", async () => {
    sistema(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(temaInicial()).toBe("oscuro");
    document.documentElement.dataset.tema = "oscuro";
    render(<Interruptor />);
    await userEvent.setup().click(screen.getByRole("button", { name: "oscuro" }));
    expect(document.documentElement.dataset.tema).toBe("claro");
  });

  it("el script en línea aplica el tema antes de pintar", () => {
    sistema(false);
    localStorage.setItem(CLAVE_TEMA, "oscuro");
    new Function(SCRIPT_TEMA)();
    expect(document.documentElement.dataset.tema).toBe("oscuro");
  });

  it("el script en línea no rompe si el almacenamiento falla", () => {
    sistema(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(() => new Function(SCRIPT_TEMA)()).not.toThrow();
    expect(document.documentElement.dataset.tema).toBe("oscuro");
  });

  it("con el modo estricto de React (montar, desmontar, montar) el modo se mantiene", () => {
    sistema(false);
    localStorage.setItem(CLAVE_TEMA, "oscuro");
    document.documentElement.dataset.tema = "oscuro";
    render(
      <StrictMode>
        <TemaPanel />
      </StrictMode>,
    );
    expect(document.documentElement.dataset.tema).toBe("oscuro");
  });

  it("al salir del panel se quita el modo, para que la web pública quede clara", () => {
    document.documentElement.dataset.tema = "oscuro";
    const { unmount } = render(<TemaPanel />);
    act(() => unmount());
    expect(document.documentElement.dataset.tema).toBeUndefined();
  });
});
