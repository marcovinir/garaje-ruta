import { expect, test } from "@playwright/test";

test("inicio, buscador compatible y seis anchos", async ({ page }, info) => {
  test.skip(info.project.name !== "escritorio", "Un recorrido por todos los anchos");
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  const inicio = page.getByRole("main");
  const hero = inicio.getByRole("region", { name: "Autos usados y repuestos en Heredia" });
  const foto = hero.locator("img");
  await expect(foto).toHaveAttribute("loading", "eager");
  await expect(foto).toHaveAttribute("fetchpriority", "high");
  await expect(foto).toHaveAttribute("sizes", "100vw");

  await expect(inicio.locator("h1, h2")).toHaveText([
    "Autos usados y repuestos en Heredia",
    "Carrocerías",
    "Ofertas",
    "Buscá repuestos compatibles",
    "Autos recién llegados",
    "Repuestos recién llegados",
    "Contacto y ubicación",
  ]);
  for (const nombre of ["Explorar autos", "Buscar repuestos"]) {
    await expect(hero.getByRole("link", { name: nombre })).toBeInViewport({ ratio: 1 });
  }

  const beneficios = inicio.getByRole("list", { name: "Beneficios" });
  const columnas = () =>
    beneficios.evaluate((lista) => getComputedStyle(lista).gridTemplateColumns.split(" ").length);
  await expect(beneficios.getByRole("listitem")).toHaveCount(4);
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 780 });
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", width);
    await expect.poll(() => foto.evaluate((img) => img.getBoundingClientRect().width)).toBe(width);
    await expect.poll(columnas).toBe(width < 1024 ? 2 : 4);
  }

  for (const tipo of ["Autos", "Repuestos"]) {
    const recienLlegados = inicio.getByRole("region", { name: tipo + " recién llegados" });
    await expect(recienLlegados.getByRole("listitem")).toHaveCount(4);
  }

  const buscador = inicio.getByRole("form", { name: "Buscá repuestos compatibles" });
  const marca = buscador.getByLabel("Marca");
  const modelo = buscador.getByLabel("Modelo");
  await expect(modelo).toBeDisabled();
  await marca.selectOption({ index: 1 });
  await modelo.selectOption({ index: 1 });
  await marca.selectOption({ index: 2 });
  await expect(modelo).toHaveValue("");
  await modelo.selectOption({ index: 1 });
  const marcaElegida = await marca.inputValue();
  const modeloElegido = await modelo.inputValue();
  await buscador.getByLabel("Año").fill("2018");
  await buscador.getByRole("button", { name: "Buscar repuestos compatibles" }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/repuestos" &&
      url.searchParams.get("compatible_marca") === marcaElegida &&
      url.searchParams.get("compatible_modelo") === modeloElegido &&
      url.searchParams.get("compatible_anio") === "2018",
  );
});
