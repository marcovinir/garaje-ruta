def nombre_modelo(marca: str, modelo: str) -> str:
    """Conserva «Mazda 3» en el catálogo y evita anteponer la marca dos veces."""
    if modelo.casefold().startswith(marca.casefold() + " "):
        return modelo
    return f"{marca} {modelo}"
