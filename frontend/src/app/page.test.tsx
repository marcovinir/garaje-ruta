import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import Home from "./page";

it("muestra el nombre del negocio y que está en construcción", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "Garaje Ruta" })).toBeInTheDocument();
  expect(screen.getByText(/en construcción/i)).toBeInTheDocument();
});
