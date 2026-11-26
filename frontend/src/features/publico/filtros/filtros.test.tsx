import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Catalogos } from "@/shared/api/tipos";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { ChipsFiltros } from "./ChipsFiltros";
import { HojaFiltros } from "./HojaFiltros";
import { Orden } from "./Orden";
import { Paginacion } from "./Paginacion";
import { AvisoCompatibilidad } from "./AvisoCompatibilidad";
import { PanelFiltros } from "./PanelFiltros";

const catalogos: Catalogos = {
  marcas: [
    {
      id: 3,
      nombre: "Toyota",
      slug: "toyota",
      modelos: [{ id: 12, nombre: "Corolla", slug: "corolla", nombre_vehiculo: "Toyota Corolla" }],
    },
    { id: 5, nombre: "Hyundai", slug: "hyundai", modelos: [] },
  ],
  categorias: [
    {
      id: 1,
      nombre: "Frenos",
      slug: "frenos",
      hijas: [{ id: 2, nombre: "Pastillas", slug: "pastillas", hijas: [] }],
    },
  ],
  transmisiones: [{ id: 1, nombre: "Automática" }],
  combustibles: [{ id: 1, nombre: "Gasolina" }],
  tracciones: [{ id: 1, nombre: "4x2" }],
  carrocerias: [{ id: 1, nombre: "SUV", slug: "suv" }],
  equipamiento: [
    {
      grupo: "Confort",
      items: [
        { id: 1, nombre: "Aire acondicionado", filtrable: true },
        { id: 4, nombre: "Cámara de retroceso", filtrable: true },
        { id: 9, nombre: "Encendedor", filtrable: false },
      ],
    },
  ],
};

describe("ChipsFiltros", () => {
  it("muestra un chip por filtro con un enlace que lo quita, y «Limpiar»", () => {
    render(
      <ChipsFiltros
        base="/autos"
        catalogos={catalogos}
        filtros={{ marca: "3", equipamiento: "1,4", orden: "precio_asc" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Quitar filtro Toyota" })).toHaveAttribute(
      "href",
      "/autos?equipamiento=1%2C4&orden=precio_asc",
    );
    expect(screen.getByRole("link", { name: "Quitar filtro Cámara de retroceso" })).toHaveAttribute(
      "href",
      "/autos?equipamiento=1&marca=3&orden=precio_asc",
    );
    // El orden no es un filtro: no tiene chip, y «Limpiar» lo conserva.
    expect(screen.queryByRole("link", { name: /precio_asc/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute(
      "href",
      "/autos?orden=precio_asc",
    );
  });

  it("no muestra nada sin filtros", () => {
    const { container } = render(<ChipsFiltros base="/autos" catalogos={catalogos} filtros={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PanelFiltros", () => {
  it("marca los valores que vienen en la URL (enlace compartido)", () => {
    render(
      <PanelFiltros
        tipo="auto"
        id="f"
        catalogos={catalogos}
        filtros={{ marca: "3", anio_min: "2015", equipamiento: "1,4", orden: "precio_asc" }}
      />,
    );
    const form = screen.getByRole("form", { name: "Filtros" });
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/autos");
    expect(screen.getByLabelText("Marca")).toHaveValue("3");
    expect(screen.getByLabelText("Año desde")).toHaveValue(2015);
    expect(screen.getByLabelText("Aire acondicionado")).toBeChecked();
    expect(screen.getByLabelText("Cámara de retroceso")).toBeChecked();
    expect(screen.queryByLabelText("Encendedor")).not.toBeInTheDocument();
    // El orden elegido viaja escondido al aplicar los filtros.
    expect(form.querySelector('input[type="hidden"][name="orden"]')).toHaveValue("precio_asc");
  });

  it("al aplicar navega sin los campos vacíos", async () => {
    const usuario = userEvent.setup();
    render(
      <PanelFiltros tipo="auto" id="f" catalogos={catalogos} filtros={{ orden: "precio_asc" }} />,
    );
    await usuario.selectOptions(screen.getByLabelText("Marca"), "3");
    await usuario.click(screen.getByText("Más filtros"));
    await usuario.click(screen.getByLabelText("Aire acondicionado"));
    await usuario.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(push).toHaveBeenCalledWith("/autos?orden=precio_asc&marca=3&equipamiento=1");
  });

  it("acepta cualquier precio en colones (no solo múltiplos de ₡100 000)", () => {
    render(
      <PanelFiltros tipo="auto" id="f" catalogos={catalogos} filtros={{ precio_max: "6250000" }} />,
    );
    expect(screen.getByLabelText("Precio hasta (₡)")).toBeValid();
  });

  it("en repuestos ofrece categoría, condición y «Buscar por vehículo»", () => {
    render(
      <PanelFiltros
        tipo="repuesto"
        id="f"
        catalogos={catalogos}
        filtros={{ categoria: "pastillas", compatible_marca: "3" }}
      />,
    );
    expect(screen.getByRole("form", { name: "Filtros" })).toHaveAttribute("action", "/repuestos");
    expect(screen.getByLabelText("Categoría")).toHaveValue("pastillas");
    const vehiculo = screen.getByRole("group", { name: "Buscar por vehículo" });
    expect(within(vehiculo).getByLabelText("Marca del vehículo")).toHaveValue("3");
    expect(screen.queryByLabelText("Kilometraje máximo")).not.toBeInTheDocument();
  });
});

describe("HojaFiltros", () => {
  beforeAll(() => {
    // jsdom no implementa showModal/close.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });

  it("abre la hoja con el botón «Filtros (n)» y la cierra", async () => {
    const usuario = userEvent.setup();
    render(
      <HojaFiltros activos={2}>
        <p>formulario</p>
      </HojaFiltros>,
    );
    const boton = screen.getByRole("button", { name: "Filtros (2)" });
    const hoja = screen.getByRole("dialog", { hidden: true });
    expect(hoja).not.toHaveAttribute("open");
    await usuario.click(boton);
    expect(hoja).toHaveAttribute("open");
    expect(hoja).toHaveAccessibleName("Filtros");
    await usuario.click(within(hoja).getByRole("button", { name: "Cerrar filtros" }));
    expect(hoja).not.toHaveAttribute("open");
  });
});

describe("Orden y Paginacion", () => {
  it("el orden son enlaces que conservan los filtros y marcan el actual", () => {
    render(<Orden base="/autos" filtros={{ marca: "3", page: "2", orden: "precio_asc" }} />);
    expect(screen.getByRole("link", { name: "Menor precio" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: "Mayor precio" })).toHaveAttribute(
      "href",
      "/autos?marca=3&orden=precio_desc",
    );
    expect(screen.getByRole("link", { name: "Recientes" })).toHaveAttribute(
      "href",
      "/autos?marca=3",
    );
  });

  it("pagina con enlaces anterior y siguiente", () => {
    render(<Paginacion base="/autos" filtros={{ marca: "3", page: "2" }} total={45} />);
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/autos?marca=3",
    );
    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/autos?marca=3&page=3",
    );
  });

  it("no pagina si todo cabe en una página", () => {
    const { container } = render(<Paginacion base="/autos" filtros={{}} total={20} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Filtros de la etapa #124", () => {
  it("deja principales visibles y avanzados plegados por defecto", async () => {
    const usuario = userEvent.setup();
    render(<PanelFiltros tipo="auto" id="f" catalogos={catalogos} filtros={{}} />);
    const resumen = screen.getByText("Más filtros");
    const avanzados = resumen.closest("details")!;
    expect(avanzados).not.toHaveAttribute("open");
    for (const nombre of [
      "Kilometraje máximo",
      "Combustible",
      "Tracción",
      "Aire acondicionado",
      "Solo ofertas",
    ]) {
      expect(avanzados).toContainElement(screen.getByLabelText(nombre));
    }
    for (const nombre of [
      "Marca",
      "Modelo",
      "Carrocería",
      "Año desde",
      "Año hasta",
      "Precio desde (₡)",
      "Precio hasta (₡)",
      "Transmisión",
    ]) {
      expect(avanzados).not.toContainElement(screen.getByLabelText(nombre));
    }
    await usuario.click(resumen);
    expect(avanzados).toHaveAttribute("open");
  });
  it.each(["km_max", "combustible", "traccion", "equipamiento", "ofertas"])(
    "abre avanzados si %s está activo en la URL",
    (clave) => {
      render(<PanelFiltros tipo="auto" id="f" catalogos={catalogos} filtros={{ [clave]: "1" }} />);
      expect(screen.getByText("Más filtros").closest("details")).toHaveAttribute("open");
    },
  );
  it("prioriza vehículo antes de categoría, condición y precio", () => {
    render(<PanelFiltros tipo="repuesto" id="f" catalogos={catalogos} filtros={{}} />);
    const vehiculo = screen.getByRole("group", { name: "Buscar por vehículo" });
    expect(
      vehiculo.compareDocumentPosition(screen.getByLabelText("Categoría")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen
        .getByLabelText("Categoría")
        .compareDocumentPosition(screen.getByLabelText("Condición")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen
        .getByLabelText("Condición")
        .compareDocumentPosition(screen.getByLabelText("Precio desde (₡)")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
  it("avisa el vehículo y lo quita conservando búsqueda, categoría, precio, ofertas y orden", () => {
    render(
      <AvisoCompatibilidad
        catalogos={catalogos}
        filtros={{
          compatible_marca: "3",
          compatible_modelo: "12",
          compatible_anio: "2020",
          categoria: "pastillas",
          q: "ABC",
          precio_max: "85000",
          ofertas: "1",
          orden: "precio_asc",
          page: "2",
        }}
      />,
    );
    expect(
      screen.getByText("Mostrando repuestos compatibles con Toyota Corolla 2020"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quitar vehículo" })).toHaveAttribute(
      "href",
      "/repuestos?categoria=pastillas&ofertas=1&orden=precio_asc&precio_max=85000&q=ABC",
    );
  });
  it.each([
    [{ compatible_marca: "3" }, "Toyota"],
    [{ compatible_modelo: "12" }, "Toyota Corolla"],
    [{ compatible_anio: "2020" }, "vehículos del año 2020"],
  ])("admite una selección parcial %j", (filtros, descripcion) => {
    render(<AvisoCompatibilidad catalogos={catalogos} filtros={filtros} />);
    expect(
      screen.getByText(`Mostrando repuestos compatibles con ${descripcion}`),
    ).toBeInTheDocument();
  });
  it("no inventa nombres para ids desconocidos ni muestra aviso sin vehículo", () => {
    const { container, rerender } = render(
      <AvisoCompatibilidad catalogos={catalogos} filtros={{}} />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<AvisoCompatibilidad catalogos={catalogos} filtros={{ compatible_marca: "999" }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
