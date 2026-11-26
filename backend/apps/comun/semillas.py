"""Datos de ejemplo de Garaje Ruta (negocio ficticio) para `manage.py sembrar`."""

ADMIN_EMAIL = "admin@garajeruta.test"
# La del demo es pública (README). La del admin y el colaborador solo sirve en desarrollo:
# fuera de él, `sembrar` exige SEMILLA_PASSWORD.
CLAVE_DEMO_POR_DEFECTO = "Demo-Garaje-2026"
CLAVE_LOCAL_POR_DEFECTO = "Local-Garaje-2026"

USUARIOS = [
    (ADMIN_EMAIL, "Mariana", "Solís", "admin"),
    ("colaborador@garajeruta.test", "Esteban", "Rojas", "colaborador"),
    ("demo@garajeruta.test", "Visita", "Demo", "demo"),
]

# (marca, modelo, carrocería, cilindrada en cc o None si es eléctrico, combustible, precio base ₡)
MODELOS = [
    ("Toyota", "Corolla", "sedan", 1800, "Gasolina", 11_500_000),
    ("Toyota", "Yaris", "hatchback", 1500, "Gasolina", 8_900_000),
    ("Toyota", "RAV4", "suv", 2500, "Gasolina", 17_500_000),
    ("Toyota", "Hilux", "pickup", 2800, "Diésel", 21_000_000),
    ("Toyota", "Prius", "hatchback", 1800, "Híbrido", 12_500_000),
    ("Hyundai", "Accent", "sedan", 1600, "Gasolina", 8_200_000),
    ("Hyundai", "Tucson", "suv", 2000, "Gasolina", 14_500_000),
    ("Hyundai", "Santa Fe", "suv", 2400, "Gasolina", 16_800_000),
    ("Hyundai", "Kona", "crossover", None, "Eléctrico", 15_200_000),
    ("Nissan", "Sentra", "sedan", 1800, "Gasolina", 9_400_000),
    ("Nissan", "X-Trail", "suv", 2500, "Gasolina", 13_800_000),
    ("Nissan", "Frontier", "pickup", 2500, "Diésel", 18_500_000),
    ("Nissan", "Leaf", "hatchback", None, "Eléctrico", 10_900_000),
    ("Kia", "Rio", "sedan", 1400, "Gasolina", 7_800_000),
    ("Kia", "Sportage", "suv", 2000, "Gasolina", 14_200_000),
    ("Kia", "Sorento", "suv", 2400, "Diésel", 17_200_000),
    ("Suzuki", "Swift", "hatchback", 1200, "Gasolina", 7_400_000),
    ("Suzuki", "Vitara", "suv", 1600, "Gasolina", 11_900_000),
    ("Suzuki", "Jimny", "suv", 1500, "Gasolina", 13_400_000),
    ("Mitsubishi", "L200", "pickup", 2400, "Diésel", 19_500_000),
    ("Mitsubishi", "Montero Sport", "suv", 2400, "Diésel", 20_500_000),
    ("Mitsubishi", "ASX", "crossover", 2000, "Gasolina", 11_200_000),
    ("Honda", "Civic", "sedan", 1500, "Gasolina", 12_800_000),
    ("Honda", "CR-V", "suv", 1500, "Gasolina", 16_200_000),
    ("Honda", "Fit", "hatchback", 1500, "Gasolina", 8_600_000),
    ("Mazda", "Mazda 3", "sedan", 2000, "Gasolina", 10_900_000),
    ("Mazda", "CX-5", "suv", 2500, "Gasolina", 15_900_000),
    ("Mazda", "BT-50", "pickup", 3000, "Diésel", 17_900_000),
    ("Chevrolet", "Spark", "hatchback", 1200, "Gasolina", 5_900_000),
    ("Chevrolet", "Tracker", "crossover", 1200, "Gasolina", 10_400_000),
    ("Chevrolet", "Colorado", "pickup", 2800, "Diésel", 19_200_000),
    ("Ford", "Ranger", "pickup", 3200, "Diésel", 20_800_000),
    ("Ford", "Escape", "suv", 1500, "Gasolina", 13_600_000),
    ("Ford", "Explorer", "suv", 2300, "Gasolina", 22_400_000),
    ("Isuzu", "D-Max", "pickup", 3000, "Diésel", 18_900_000),
    ("Isuzu", "MU-X", "suv", 3000, "Diésel", 19_800_000),
    ("Isuzu", "NPR", "comercial", 3000, "Diésel", 21_500_000),
    ("BYD", "Dolphin", "hatchback", None, "Eléctrico", 13_900_000),
    ("BYD", "Yuan Plus", "crossover", None, "Eléctrico", 16_400_000),
    ("BYD", "Song Plus", "suv", 1500, "Híbrido enchufable", 18_600_000),
]

# Primer año en que existe el modelo (o su versión eléctrica/actual); el resto parte de 2008.
ANIO_MINIMO = {
    "Kona": 2019,
    "Leaf": 2011,
    "Dolphin": 2022,
    "Yuan Plus": 2022,
    "Song Plus": 2021,
    "Tracker": 2020,
    "Jimny": 2019,
    "MU-X": 2014,
    "BT-50": 2012,
}

# Equipamiento que solo tiene sentido en ciertos autos.
SOLO_PICKUP = {"Cobertor de cajón"}
SOLO_PICKUP_O_SUV = {"Estribos"}
NO_ELECTRICO = {"Turbo"}
SOLO_CAJA_DUAL = {"Caja de cambios dual"}
DESDE_2016 = {
    "Apple CarPlay",
    "Android Auto",
    "Cargador inalámbrico",
    "Tablero digital",
    "Cámara 360°",
    "Monitor de punto ciego",
    "Asistente de carril",
    "Frenado autónomo de emergencia",
}


def equipamiento_posible(
    nombre: str, carroceria: str, combustible: str, transmision: str, anio: int, modelo: str = ""
) -> bool:
    """`carroceria` es el slug; `combustible` y `transmision`, los nombres del catálogo."""
    if nombre in SOLO_PICKUP and carroceria != "pickup":
        return False
    if nombre in SOLO_PICKUP_O_SUV and carroceria not in ("pickup", "suv"):
        return False
    if nombre in NO_ELECTRICO and combustible == "Eléctrico":
        return False
    if nombre in SOLO_CAJA_DUAL and transmision != "Automática con modo manual":
        return False
    if nombre in EQUIPAMIENTO_EXCLUIDO_MODELO.get(modelo, set()):
        return False
    return not (nombre in DESDE_2016 and anio < 2016)


# Hijas de las categorías raíz que siembra la migración de catálogos: (slug del padre, nombre, slug)
CATEGORIAS_HIJAS = [
    ("sistema-electrico", "Alternador", "alternador"),
    ("sistema-electrico", "Batería", "bateria"),
    ("sistema-electrico", "Motor de arranque", "motor-de-arranque"),
    ("frenos", "Pastillas de freno", "pastillas-de-freno"),
    ("frenos", "Discos de freno", "discos-de-freno"),
    ("iluminacion", "Faros", "faros"),
    ("iluminacion", "Stops", "stops"),
    ("suspension-y-direccion", "Amortiguadores", "amortiguadores"),
    ("enfriamiento", "Radiadores", "radiadores"),
    ("motor", "Bombas de agua", "bombas-de-agua"),
    ("carroceria", "Espejos", "espejos"),
    ("llantas-y-aros", "Aros", "aros"),
]

# (nombre de la pieza, slug de la categoría, precio mínimo ₡, precio máximo ₡)
PIEZAS = [
    ("Alternador", "alternador", 35_000, 120_000),
    ("Batería", "bateria", 45_000, 95_000),
    ("Motor de arranque", "motor-de-arranque", 40_000, 110_000),
    ("Pastillas de freno delanteras", "pastillas-de-freno", 12_000, 38_000),
    ("Discos de freno delanteros", "discos-de-freno", 25_000, 70_000),
    ("Faro delantero izquierdo", "faros", 28_000, 160_000),
    ("Faro delantero derecho", "faros", 28_000, 160_000),
    ("Stop trasero", "stops", 18_000, 85_000),
    ("Amortiguador delantero", "amortiguadores", 22_000, 75_000),
    ("Radiador", "radiadores", 45_000, 140_000),
    ("Bomba de agua", "bombas-de-agua", 18_000, 60_000),
    ("Espejo retrovisor", "espejos", 15_000, 90_000),
    ("Aro de lujo 16 pulgadas", "aros", 35_000, 95_000),
    ("Caja de cambios manual", "transmision", 180_000, 650_000),
    ("Tapicería completa", "interior", 90_000, 280_000),
    ("Culata", "motor", 120_000, 380_000),
]

# Fotos de ejemplo en Cloudinary (las sube un comando del Plan 2).
FOTOS_AUTOS = [f"garaje-ruta/ejemplo/auto-{n:02d}" for n in range(1, 25)]
FOTOS_REPUESTOS = [f"garaje-ruta/ejemplo/repuesto-{n:02d}" for n in range(1, 17)]


def _foto(nombre: str) -> str:
    return f"garaje-ruta/ejemplo/{nombre}"


# Qué muestra cada foto (docs/fotos-ejemplo.md). Solo se siembran autos de estos modelos,
# para que la foto coincida con la ficha: modelo → (fotos exteriores, color de la foto).
FOTOS_MODELO = {
    "Corolla": ([_foto("auto-01"), _foto("auto-02")], "Blanco"),
    "RAV4": ([_foto("auto-04")], "Gris oscuro"),
    "Hilux": ([_foto("auto-05")], "Plateado"),
    "Swift": ([_foto("auto-06")], "Rojo"),
    "Kona": ([_foto("auto-08")], "Azul"),
    "Sentra": ([_foto("auto-09")], "Plateado"),
    "Montero Sport": ([_foto("auto-10")], "Blanco"),
    "D-Max": ([_foto("auto-11")], "Blanco"),
    "Leaf": ([_foto("auto-12")], "Blanco"),
    "Sportage": ([_foto("auto-14")], "Negro"),
    "Mazda 3": ([_foto("auto-15")], "Azul"),
    "Jimny": ([_foto("auto-17")], "Verde"),
    "NPR": ([_foto("auto-18")], "Blanco"),
    "Fit": ([_foto("auto-19")], "Plateado"),
    "Yuan Plus": ([_foto("auto-20")], "Plateado"),
    "Ranger": ([_foto("auto-21")], "Rojo"),
    "Explorer": ([_foto("auto-23")], "Blanco"),
}
# Interior según la carrocería: (foto, color del interior). El camión no lleva interior.
FOTO_INTERIOR = {
    "sedan": (_foto("auto-03"), "Negro"),
    "hatchback": (_foto("auto-03"), "Negro"),
    "crossover": (_foto("auto-03"), "Negro"),
    "suv": (_foto("auto-07"), "Beige"),
    "pickup": (_foto("auto-16"), "Gris"),
}
FOTO_MOTOR = _foto("auto-13")  # motor de combustión: no va en eléctricos
FOTO_TABLERO = _foto("auto-22")  # tablero digital con CarPlay: desde 2016
FOTO_PATIO = _foto("auto-24")

# Cada pieza de PIEZAS con su foto (los dos faros comparten la misma).
FOTO_PIEZA = {
    "Alternador": _foto("repuesto-01"),
    "Batería": _foto("repuesto-02"),
    "Motor de arranque": _foto("repuesto-03"),
    "Pastillas de freno delanteras": _foto("repuesto-04"),
    "Discos de freno delanteros": _foto("repuesto-05"),
    "Faro delantero izquierdo": _foto("repuesto-06"),
    "Faro delantero derecho": _foto("repuesto-06"),
    "Stop trasero": _foto("repuesto-07"),
    "Amortiguador delantero": _foto("repuesto-08"),
    "Radiador": _foto("repuesto-09"),
    "Bomba de agua": _foto("repuesto-10"),
    "Espejo retrovisor": _foto("repuesto-11"),
    "Aro de lujo 16 pulgadas": _foto("repuesto-12"),
    "Caja de cambios manual": _foto("repuesto-13"),
    "Tapicería completa": _foto("repuesto-14"),
    "Culata": _foto("repuesto-15"),
}


def fotos_auto(modelo: str, carroceria: str, combustible: str, anio: int) -> list[str]:
    """Las fotos de un auto sembrado, en orden: exteriores, interior, motor, tablero y patio."""
    fotos = list(FOTOS_MODELO[modelo][0])
    if carroceria in FOTO_INTERIOR:
        fotos.append(FOTO_INTERIOR[carroceria][0])
    if combustible != "Eléctrico":
        fotos.append(FOTO_MOTOR)
    if anio >= 2016:
        fotos.append(FOTO_TABLERO)
    fotos.append(FOTO_PATIO)
    return fotos


DESCRIPCION_AUTO = (
    "{titulo}. {km} km, transmisión {transmision}, combustible {combustible}. "
    "{color}, tracción {traccion}. Escribinos por WhatsApp para consultar este auto de ejemplo."
)
DESCRIPCION_REPUESTO = (
    "{titulo}, {condicion}. Compatibilidad de ejemplo: {desde}–{hasta}. "
    "Código interno {codigo}. Consultá la compatibilidad por WhatsApp."
)


# Lista conservadora para los ejemplos: no se deduce equipamiento de una versión.
# Leaf no ofrece techo solar ni control de descenso; NPR es un camión de trabajo.
EQUIPAMIENTO_EXCLUIDO_MODELO = {
    "Leaf": {"Techo solar o panorámico", "Control de descenso"},
    "NPR": {
        "Techo solar o panorámico",
        "Asiento con memoria",
        "Asientos con calefacción",
        "Control de descenso",
    },
}
