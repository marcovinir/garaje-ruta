"""Datos de ejemplo de Garaje Ruta (negocio ficticio) para `manage.py sembrar`."""

ADMIN_EMAIL = "admin@garajeruta.test"
CLAVE_DEMO_POR_DEFECTO = "Demo-Garaje-2026"

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

COLORES = ["Blanco", "Negro", "Gris oscuro", "Plateado", "Rojo", "Azul", "Beige", "Verde"]
COLORES_INTERIOR = ["Negro", "Gris", "Beige"]

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

DESCRIPCION_AUTO = (
    "{titulo} en {estado}. {km} km, {transmision}, {combustible}. "
    "Revisado por nuestro taller y listo para traspaso. Escribinos por WhatsApp para verlo."
)
DESCRIPCION_REPUESTO = (
    "{titulo}, {condicion}. Probado antes de la venta. Consultá la compatibilidad por WhatsApp."
)
