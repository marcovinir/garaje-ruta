"""Texto para publicar un artículo en Facebook Marketplace (se copia y pega a mano)."""

from django.conf import settings

from apps.actividad.models import TipoCambio
from apps.catalogos.presentacion import nombre_modelo
from apps.negocio.models import ConfiguracionNegocio

from .models import COMBUSTIBLES_CON_BATERIA, Articulo, TipoArticulo
from .presentacion import precio_usd, ruta_publica


def miles(numero: int) -> str:
    return f"{numero:,}".replace(",", " ")


def telefono_local(whatsapp: str) -> str:
    """50686877280 → 8687-7280; otro formato se deja tal cual."""
    digitos = "".join(c for c in whatsapp if c.isdigit())
    if digitos.startswith("506") and len(digitos) == 11:
        digitos = digitos[3:]
    return f"{digitos[:4]}-{digitos[4:]}" if len(digitos) == 8 else digitos


def _precio(articulo: Articulo, tipo: TipoCambio | None) -> str:
    texto = f"₡{miles(articulo.precio_colones)}"
    if (usd := precio_usd(articulo.precio_colones, tipo)) is not None:
        texto += f" (≈ ${miles(usd)})"
    return texto


def _lineas_auto(auto) -> tuple[list[dict], list[str]]:
    campos = [
        {"etiqueta": "Tipo de vehículo", "valor": auto.carroceria.nombre},
        {"etiqueta": "Año", "valor": str(auto.anio)},
        {"etiqueta": "Marca", "valor": auto.modelo.marca.nombre},
        {"etiqueta": "Modelo", "valor": " ".join(filter(None, [auto.modelo.nombre, auto.version]))},
        {"etiqueta": "Kilometraje", "valor": f"{miles(auto.kilometraje)} km"},
        {"etiqueta": "Transmisión", "valor": auto.transmision.nombre},
        {"etiqueta": "Combustible", "valor": auto.combustible.nombre},
        {"etiqueta": "Color exterior", "valor": auto.color_exterior},
        {"etiqueta": "Color interior", "valor": auto.color_interior},
        {"etiqueta": "Estado", "valor": auto.get_estado_general_display()},
    ]
    datos = [f"{miles(auto.kilometraje)} km", auto.transmision.nombre, auto.combustible.nombre]
    if auto.cilindrada_cc:
        datos.append(f"{miles(auto.cilindrada_cc)} cc")
    datos.append(auto.traccion.nombre)
    puntos = [" · ".join(datos)]
    if auto.combustible.nombre in COMBUSTIBLES_CON_BATERIA and auto.autonomia_km:
        puntos.append(f"Autonomía de {miles(auto.autonomia_km)} km")
    papeles = []
    if auto.unico_dueno:
        papeles.append("Único dueño")
    papeles.append("De agencia" if auto.procedencia == "agencia" else "Importado")
    if auto.marchamo_al_dia:
        papeles.append(
            f"Marchamo {auto.marchamo_anio} al día" if auto.marchamo_anio else "Marchamo al día"
        )
    if auto.riteve_vence:
        papeles.append(f"RTV hasta {auto.riteve_vence:%m/%Y}")
    if auto.sin_gravamenes:
        papeles.append("Sin gravámenes")
    puntos.append(" · ".join(papeles))
    if equipo := [e.nombre for e in auto.equipamiento.all()]:
        puntos.append("Equipamiento: " + ", ".join(sorted(equipo, key=str.casefold)))
    trato = []
    if auto.precio_negociable:
        trato.append("Precio negociable")
    if auto.acepta_vehiculo:
        trato.append("Recibimos vehículo")
    if auto.financiamiento:
        trato.append("Financiamiento")
    if auto.traspaso_incluido:
        trato.append("Traspaso incluido")
    if trato:
        puntos.append(" · ".join(trato))
    return campos, puntos


def _lineas_repuesto(repuesto) -> tuple[list[dict], list[str]]:
    categoria = repuesto.categoria_pieza
    campos = [
        {"etiqueta": "Categoría", "valor": "Repuestos de vehículos"},
        {"etiqueta": "Estado", "valor": repuesto.get_condicion_display()},
        {"etiqueta": "Marca", "valor": repuesto.fabricante or ""},
    ]
    puntos = [
        " · ".join(
            filter(
                None,
                [
                    repuesto.get_condicion_display(),
                    repuesto.get_clasificacion_display() if repuesto.clasificacion else "",
                    categoria.nombre,
                ],
            )
        )
    ]
    if repuesto.numero_parte:
        puntos.append(f"Número de parte: {repuesto.numero_parte}")
    compatibles = sorted(
        repuesto.compatibilidades.all(), key=lambda c: (c.anio_desde, c.modelo.nombre)
    )
    if compatibles:
        nombres = [
            f"{nombre_modelo(c.modelo.marca.nombre, c.modelo.nombre)} {c.anio_desde}–{c.anio_hasta}"
            for c in compatibles[:4]
        ]
        resto = len(compatibles) - len(nombres)
        puntos.append("Compatible con " + ", ".join(nombres) + (f" y {resto} más" if resto else ""))
    return campos, puntos


def texto_marketplace(articulo: Articulo) -> dict:
    """Casillas del formulario de Marketplace y la descripción lista para pegar."""
    tipo_cambio = TipoCambio.vigente()
    negocio = ConfiguracionNegocio.objects.filter(pk=1).first()
    precio = _precio(articulo, tipo_cambio)
    if articulo.tipo == TipoArticulo.AUTO:
        campos, puntos = _lineas_auto(articulo.auto)
    else:
        campos, puntos = _lineas_repuesto(articulo.repuesto)
    campos = [
        {"etiqueta": "Título", "valor": articulo.titulo},
        {"etiqueta": "Precio", "valor": str(articulo.precio_colones)},
        *campos,
    ]

    lineas = [f"{articulo.titulo} · {precio}", ""]
    lineas += [f"✔ {p}" for p in puntos if p]
    if articulo.descripcion.strip():
        lineas += ["", articulo.descripcion.strip()]
    lineas.append("")
    if negocio:
        lineas.append(f"📍 {negocio.nombre}, {negocio.direccion}")
    lineas.append(f"Más fotos y detalles: {settings.FRONTEND_URL}{ruta_publica(articulo)}")
    if negocio and negocio.whatsapp:
        lineas.append(f"WhatsApp: {telefono_local(negocio.whatsapp)}")

    return {
        "campos": [c for c in campos if c["valor"]],
        "descripcion": "\n".join(lineas),
        "fotos": [f.public_id for f in articulo.fotos.all()],
    }
