"""Valores iniciales de los catálogos (los siembra la migración 0002).

El equipamiento sigue el §6 del diseño (basado en la ficha de CRAutos).
Un nombre que termina en «★» es filtrable; la estrella no se guarda.
"""

TRANSMISIONES = ["Manual", "Automática", "Automática/Dual", "CVT"]
COMBUSTIBLES = ["Gasolina", "Diésel", "Híbrido", "Híbrido enchufable", "Eléctrico", "Gas LP"]
TRACCIONES = ["4x2", "4x4", "AWD"]
CARROCERIAS = [
    ("Sedán", "sedan"),
    ("Hatchback", "hatchback"),
    ("SUV", "suv"),
    ("Crossover", "crossover"),
    ("Pickup", "pickup"),
    ("Microbús", "microbus"),
    ("Comercial", "comercial"),
    ("Coupé", "coupe"),
]

EQUIPAMIENTO: dict[str, list[str]] = {
    "Confort": [
        "Aire acondicionado ★",
        "Aire acondicionado climatizado",
        "Vidrios eléctricos ★",
        "Espejos eléctricos",
        "Retrovisores auto-retractables",
        "Cierre central",
        "Tapicería de cuero ★",
        "Asientos eléctricos",
        "Asiento con memoria",
        "Asientos con calefacción",
        "Techo solar o panorámico ★",
        "Volante multifunción",
        "Volante ajustable",
        "Control crucero ★",
        "Llave inteligente / botón de arranque",
        "Sensor de lluvia",
        "Desempañador trasero",
    ],
    "Seguridad": [
        "Frenos ABS",
        "Control electrónico de estabilidad",
        "Control de descenso",
        "Cámara de retroceso ★",
        "Sensores de retroceso ★",
        "Sensores delanteros",
        "Cámara 360°",
        "Alarma",
        "Monitor de punto ciego",
        "Asistente de carril",
        "Frenado autónomo de emergencia",
    ],
    "Tecnología": [
        "Pantalla táctil",
        "Apple CarPlay ★",
        "Android Auto ★",
        "Bluetooth",
        "Radio con USB/AUX",
        "GPS",
        "Cargador inalámbrico",
        "Computadora de viaje",
        "Tablero digital",
    ],
    "Motor y manejo": [
        "Turbo",
        "Dirección hidráulica / electroasistida",
        "Caja de cambios dual",
    ],
    "Exterior": [
        "Aros de lujo",
        "Halógenos",
        "Faros LED",
        "Luces de xenón / bixenón",
        "Faros de niebla",
        "Rack de techo",
        "Tiro (enganche)",
        "Estribos",
        "Cobertor de cajón",
        "Vidrios tintados / polarizados",
    ],
}

CATEGORIAS_PIEZA_RAIZ = [
    ("Motor", "motor"),
    ("Transmisión", "transmision"),
    ("Suspensión y dirección", "suspension-y-direccion"),
    ("Frenos", "frenos"),
    ("Sistema eléctrico", "sistema-electrico"),
    ("Enfriamiento", "enfriamiento"),
    ("Carrocería", "carroceria"),
    ("Iluminación", "iluminacion"),
    ("Interior", "interior"),
    ("Llantas y aros", "llantas-y-aros"),
]
