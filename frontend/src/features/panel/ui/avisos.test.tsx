import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProveedorAvisos } from "./Avisos";
import { useAvisos } from "./contextoAvisos";

function Disparador() {
  const { avisar } = useAvisos();
  return (
    <button
      type="button"
      onClick={() =>
        avisar("Vendido: Corolla", { accion: { etiqueta: "Deshacer", alHacer: () => {} } })
      }
    >
      Vender
    </button>
  );
}

describe("avisos", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const montar = () => {
    render(
      <ProveedorAvisos>
        <Disparador />
      </ProveedorAvisos>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Vender" }));
  };

  it("el aviso con «Deshacer» se cierra solo a los 8 s", () => {
    montar();
    act(() => vi.advanceTimersByTime(7_900));
    expect(screen.getByText("Vendido: Corolla")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText("Vendido: Corolla")).not.toBeInTheDocument();
  });

  it("no se cierra mientras tiene el mouse encima o el foco (WCAG 2.2.1)", () => {
    montar();
    const aviso = screen.getByText("Vendido: Corolla").parentElement!;
    fireEvent.mouseEnter(aviso);
    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.getByText("Vendido: Corolla")).toBeInTheDocument();
    fireEvent.mouseLeave(aviso);
    fireEvent.focusIn(screen.getByRole("button", { name: "Deshacer" }));
    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.getByText("Vendido: Corolla")).toBeInTheDocument();
    fireEvent.focusOut(screen.getByRole("button", { name: "Deshacer" }));
    act(() => vi.advanceTimersByTime(8_100));
    expect(screen.queryByText("Vendido: Corolla")).not.toBeInTheDocument();
  });
});
