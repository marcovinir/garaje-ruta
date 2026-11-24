"""Fuentes del tipo de cambio del dólar en colones.

El BCCR (oficial) queda como issue aparte: su servicio web respondió 503 y su documentación 404
(revisado 2026-11-24). Cuando esté, se agrega `ProveedorBccr` al inicio de
`settings.TIPO_CAMBIO_PROVEEDORES` sin tocar lo demás.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Protocol

import requests

DOS_DECIMALES = Decimal("0.01")


class TipoCambioNoDisponible(Exception):
    pass


class ProveedorTipoCambio(Protocol):
    nombre: str

    def obtener(self) -> tuple[Decimal, Decimal]:
        """(compra, venta) en colones por dólar; lanza TipoCambioNoDisponible si falla."""
        ...


class OpenErApi:
    """open.er-api.com: tasa de mercado, una sola (sirve de compra y venta).

    Sus términos piden un enlace «Rates By Exchange Rate API» donde se muestren las tasas.
    """

    nombre = "open.er-api.com"
    URL = "https://open.er-api.com/v6/latest/USD"

    def obtener(self) -> tuple[Decimal, Decimal]:
        try:
            respuesta = requests.get(self.URL, timeout=10)
            respuesta.raise_for_status()
            datos = respuesta.json()
        except (requests.RequestException, ValueError) as error:
            raise TipoCambioNoDisponible(str(error)) from error
        if datos.get("result") != "success" or "CRC" not in datos.get("rates", {}):
            raise TipoCambioNoDisponible(f"Respuesta inesperada: {datos.get('error-type')}")
        tasa = Decimal(str(datos["rates"]["CRC"])).quantize(DOS_DECIMALES, ROUND_HALF_UP)
        return tasa, tasa


class ProveedorTipoCambioFijo:
    """Para pruebas y desarrollo sin internet."""

    nombre = "fijo"

    def __init__(self, compra: str = "442.00", venta: str = "448.00") -> None:
        self.compra, self.venta = Decimal(compra), Decimal(venta)

    def obtener(self) -> tuple[Decimal, Decimal]:
        return self.compra, self.venta
