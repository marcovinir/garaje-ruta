"""Crea los datos de ejemplo de Garaje Ruta (negocio ficticio)."""

import os
import random
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.actividad.models import AccionHistorial, HistorialCambio, TipoCambio, Venta, VistaDiaria
from apps.articulos.models import (
    Articulo,
    Auto,
    AutoEquipamiento,
    Compatibilidad,
    CondicionRepuesto,
    EstadoArticulo,
    EstadoGeneral,
    Foto,
    Procedencia,
    Repuesto,
    TipoArticulo,
)
from apps.catalogos.models import (
    Carroceria,
    CategoriaPieza,
    Combustible,
    Equipamiento,
    Marca,
    Modelo,
    Traccion,
    Transmision,
)
from apps.comun import semillas
from apps.cuentas.models import Usuario

TOTAL_AUTOS = 40
TOTAL_REPUESTOS = 80
AUTOS_VENDIDOS = 4
AUTOS_RESERVADOS = 2
DESTACADOS = 6
REPUESTOS_AGOTADOS = 10
DIAS_VISTAS = 60
DIAS_TIPO_CAMBIO = 60


class Command(BaseCommand):
    help = "Crea los datos de ejemplo (autos, repuestos, ventas, vistas y usuarios)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reiniciar",
            action="store_true",
            help="Borra los datos de ejemplo y los vuelve a crear (conserva el admin).",
        )

    @transaction.atomic
    def handle(self, *args, reiniciar: bool = False, **opciones):
        self.clave, self.clave_demo = self._claves()
        if Articulo.objects.exists() and not reiniciar:
            self.stdout.write("Ya hay datos de ejemplo. Usa --reiniciar para regenerarlos.")
            return
        if reiniciar:
            self._borrar()

        self.rng = random.Random(42)
        self.ahora = timezone.now()
        self.hoy = timezone.localdate(self.ahora)

        self.admin = self._usuarios()
        modelos = self._marcas_y_modelos()
        self._categorias_hijas()
        autos = self._autos(modelos)
        repuestos = self._repuestos(modelos)
        self._vistas(autos + repuestos)
        self._tipo_cambio()

        self.stdout.write(
            self.style.SUCCESS(
                f"Creados: {len(autos)} autos, {len(repuestos)} repuestos, "
                f"{Venta.objects.count()} ventas, {VistaDiaria.objects.count()} registros de "
                f"vistas, {TipoCambio.objects.count()} tipos de cambio y "
                f"{Usuario.objects.count()} usuarios."
            )
        )

    # --- Limpieza ---------------------------------------------------------------------------

    def _borrar(self) -> None:
        HistorialCambio.objects.all().delete()
        VistaDiaria.objects.all().delete()
        Venta.objects.all().delete()
        Articulo.objects.all().delete()
        Modelo.objects.all().delete()
        Marca.objects.all().delete()
        CategoriaPieza.objects.filter(padre__isnull=False).delete()
        TipoCambio.objects.all().delete()
        Usuario.objects.exclude(email=semillas.ADMIN_EMAIL).delete()

    # --- Catálogos y usuarios -------------------------------------------------------------

    def _claves(self) -> tuple[str, str]:
        """La del demo se publica en el README; la del admin y el colaborador nunca."""
        clave = os.environ.get("SEMILLA_PASSWORD")
        if not clave:
            if not settings.SEMILLA_CLAVE_LOCAL_PERMITIDA:
                raise CommandError(
                    "Define SEMILLA_PASSWORD (clave del admin y del colaborador) fuera de "
                    "desarrollo: la clave por defecto es pública."
                )
            clave = semillas.CLAVE_LOCAL_POR_DEFECTO
        return clave, os.environ.get("SEMILLA_PASSWORD_DEMO", semillas.CLAVE_DEMO_POR_DEFECTO)

    def _usuarios(self) -> Usuario:
        for email, nombre, apellidos, rol in semillas.USUARIOS:
            if not Usuario.objects.filter(email=email).exists():
                clave = self.clave_demo if rol == "demo" else self.clave
                Usuario.objects.crear_usuario(
                    email, nombre, apellidos, rol, password=clave, activo=True
                )
        return Usuario.objects.get(email=semillas.ADMIN_EMAIL)

    def _marcas_y_modelos(self) -> list[tuple[Modelo, tuple]]:
        modelos = []
        for datos in semillas.MODELOS:
            marca_nombre, modelo_nombre = datos[0], datos[1]
            marca, _ = Marca.objects.get_or_create(
                nombre=marca_nombre, defaults={"slug": slugify(marca_nombre)}
            )
            modelo = Modelo.objects.create(
                marca=marca, nombre=modelo_nombre, slug=slugify(modelo_nombre)
            )
            modelos.append((modelo, datos))
        return modelos

    def _categorias_hijas(self) -> None:
        for padre_slug, nombre, slug in semillas.CATEGORIAS_HIJAS:
            CategoriaPieza.objects.get_or_create(
                slug=slug,
                defaults={"nombre": nombre, "padre": CategoriaPieza.objects.get(slug=padre_slug)},
            )

    # --- Autos ------------------------------------------------------------------------------

    def _autos(self, modelos) -> list[Articulo]:
        rng = self.rng
        transmisiones = {t.nombre: t for t in Transmision.objects.all()}
        combustibles = {c.nombre: c for c in Combustible.objects.all()}
        tracciones = {t.nombre: t for t in Traccion.objects.all()}
        carrocerias = {c.slug: c for c in Carroceria.objects.all()}
        equipamiento = list(Equipamiento.objects.all())
        anio_actual = self.ahora.year

        # Solo modelos con foto propia, para que la foto coincida con la ficha.
        con_foto = [(m, d) for m, d in modelos if m.nombre in semillas.FOTOS_MODELO]
        articulos = []
        for i in range(TOTAL_AUTOS):
            modelo, (_, _, carroceria, cilindrada, combustible, base) = con_foto[i % len(con_foto)]
            anio = rng.randint(semillas.ANIO_MINIMO.get(modelo.nombre, 2008), anio_actual)
            antiguedad = anio_actual - anio
            km = max(5_000, antiguedad * rng.randint(9_000, 18_000))
            precio = max(2_500_000, int(base * (0.93**antiguedad) / 50_000) * 50_000)

            if i < AUTOS_VENDIDOS:
                estado = EstadoArticulo.VENDIDO
            elif i < AUTOS_VENDIDOS + AUTOS_RESERVADOS:
                estado = EstadoArticulo.RESERVADO
            else:
                estado = EstadoArticulo.DISPONIBLE
            disponible = estado == EstadoArticulo.DISPONIBLE
            destacado = disponible and i >= TOTAL_AUTOS - DESTACADOS
            precio_anterior = None
            if disponible and rng.random() < 0.2:
                precio_anterior = precio + rng.randint(4, 16) * 50_000

            electrico = combustible == "Eléctrico"
            if electrico or carroceria in ("suv", "crossover"):
                transmision = "Automática"
            elif carroceria == "pickup":
                transmision = rng.choice(["Manual", "Automática/Dual"])
            else:
                transmision = rng.choice(["Manual", "Automática", "CVT"])
            traccion = "4x4" if carroceria == "pickup" and rng.random() < 0.7 else "4x2"
            if carroceria == "suv" and rng.random() < 0.3:
                traccion = "AWD"

            titulo = f"{modelo.marca.nombre} {modelo.nombre} {anio}"
            publicado = self.ahora - timedelta(days=rng.randint(1, 179), hours=rng.randint(0, 23))
            articulo = Articulo.objects.create(
                tipo=TipoArticulo.AUTO,
                titulo=titulo,
                descripcion=semillas.DESCRIPCION_AUTO.format(
                    titulo=titulo,
                    estado="muy buen estado",
                    km=f"{km:,}".replace(",", " "),
                    transmision=transmision.lower(),
                    combustible=combustible.lower(),
                ),
                precio_colones=precio,
                precio_anterior_colones=precio_anterior,
                estado=estado,
                destacado=destacado,
                publicado_en=publicado,
                creado_por=self.admin,
            )
            auto = Auto.objects.create(
                articulo=articulo,
                modelo=modelo,
                anio=anio,
                kilometraje=km,
                transmision=transmisiones[transmision],
                combustible=combustibles[combustible],
                traccion=tracciones[traccion],
                carroceria=carrocerias[carroceria],
                color_exterior=semillas.FOTOS_MODELO[modelo.nombre][1],
                color_interior=semillas.FOTO_INTERIOR.get(carroceria, ("", "Gris"))[1],
                cilindrada_cc=cilindrada,
                puertas=2 if carroceria == "comercial" else rng.choice([4, 5]),
                pasajeros=3 if carroceria == "comercial" else rng.choice([5, 5, 5, 7]),
                bolsas_aire=min(10, 2 + max(0, anio - 2010) // 3 * 2),
                unico_dueno=rng.random() < 0.4,
                procedencia=rng.choice([Procedencia.AGENCIA, Procedencia.IMPORTADO]),
                marchamo_al_dia=rng.random() < 0.9,
                riteve_vence=(self.ahora + timedelta(days=rng.randint(20, 360))).date(),
                impuestos_pagados=True,
                acepta_vehiculo=rng.random() < 0.3,
                precio_negociable=rng.random() < 0.6,
                estado_general=rng.choice(list(EstadoGeneral)[:3]),
                placa_termina_en=rng.randint(0, 9),
            )
            cuantos = min(18, 6 + max(0, anio - 2008) * 12 // max(1, anio_actual - 2008))
            AutoEquipamiento.objects.bulk_create(
                AutoEquipamiento(auto=auto, equipamiento=e)
                for e in rng.sample(
                    [
                        e
                        for e in equipamiento
                        if semillas.equipamiento_posible(
                            e.nombre, carroceria, combustible, transmision, anio
                        )
                    ],
                    cuantos,
                )
            )
            self._fotos(articulo, semillas.fotos_auto(modelo.nombre, carroceria, combustible, anio))
            self._historial_creacion(articulo)
            if estado == EstadoArticulo.VENDIDO:
                self._vender(articulo, 1, precio)
            articulos.append(articulo)
        return articulos

    # --- Repuestos --------------------------------------------------------------------------

    def _repuestos(self, modelos) -> list[Articulo]:
        rng = self.rng
        categorias = {c.slug: c for c in CategoriaPieza.objects.all()}
        anio_actual = self.ahora.year
        articulos = []
        for i in range(TOTAL_REPUESTOS):
            pieza, categoria, minimo, maximo = semillas.PIEZAS[i % len(semillas.PIEZAS)]
            modelo, _ = modelos[(i * 7) % len(modelos)]
            condicion = rng.choice([CondicionRepuesto.USADO, CondicionRepuesto.USADO, "nuevo"])
            precio = int(rng.randint(minimo, maximo) / 1_000) * 1_000
            agotado = i < REPUESTOS_AGOTADOS
            stock_inicial = rng.randint(1, 3) if agotado else rng.randint(2, 8)
            vendidas = stock_inicial if agotado else rng.randint(0, stock_inicial - 1)

            titulo = f"{pieza} {modelo.marca.nombre} {modelo.nombre}"
            articulo = Articulo.objects.create(
                tipo=TipoArticulo.REPUESTO,
                titulo=titulo,
                descripcion=semillas.DESCRIPCION_REPUESTO.format(
                    titulo=titulo, condicion=CondicionRepuesto(condicion).label.lower()
                ),
                precio_colones=precio,
                publicado_en=self.ahora - timedelta(days=rng.randint(1, 179)),
                creado_por=self.admin,
            )
            repuesto = Repuesto.objects.create(
                articulo=articulo,
                categoria_pieza=categorias[categoria],
                condicion=condicion,
                cantidad=stock_inicial - vendidas,
                codigo_interno=f"GR-R{i + 1:04d}",
                numero_parte=f"{rng.randint(10000, 99999)}-{rng.choice('ABCDEFGHJK')}{i:02d}",
            )
            desde = rng.randint(2006, anio_actual - 4)
            Compatibilidad.objects.create(
                repuesto=repuesto,
                modelo=modelo,
                anio_desde=desde,
                anio_hasta=min(anio_actual, desde + rng.randint(2, 6)),
            )
            hermanos = [m for m, _ in modelos if m.marca_id == modelo.marca_id and m != modelo]
            for otro in rng.sample(hermanos, min(len(hermanos), rng.randint(0, 2))):
                desde_otro = rng.randint(2008, anio_actual - 3)
                Compatibilidad.objects.create(
                    repuesto=repuesto,
                    modelo=otro,
                    anio_desde=desde_otro,
                    anio_hasta=min(anio_actual, desde_otro + rng.randint(1, 5)),
                )
            self._fotos(articulo, [semillas.FOTO_PIEZA[pieza]])
            self._historial_creacion(articulo)
            for _ in range(vendidas):
                self._vender(articulo, 1, precio)
            articulos.append(articulo)
        return articulos

    # --- Piezas comunes ---------------------------------------------------------------------

    def _fotos(self, articulo: Articulo, public_ids: list[str]) -> None:
        Foto.objects.bulk_create(
            Foto(articulo=articulo, public_id=public_id, ancho=1600, alto=1200, orden=n + 1)
            for n, public_id in enumerate(public_ids)
        )

    def _historial_creacion(self, articulo: Articulo) -> None:
        HistorialCambio.objects.create(
            articulo=articulo,
            usuario=self.admin,
            accion=AccionHistorial.CREAR,
            fecha=articulo.publicado_en,
        )

    def _vender(self, articulo: Articulo, cantidad: int, precio: int) -> None:
        dias_publicado = max(1, (self.ahora - articulo.publicado_en).days)
        fecha = articulo.publicado_en + timedelta(days=self.rng.randint(1, dias_publicado))
        fecha = min(fecha, self.ahora)
        Venta.objects.create(
            articulo=articulo,
            cantidad=cantidad,
            precio_unitario_colones=precio,
            registrada_por=self.admin,
            fecha=fecha,
        )
        HistorialCambio.objects.create(
            articulo=articulo,
            usuario=self.admin,
            accion=AccionHistorial.VENDER,
            detalle={"cantidad": cantidad, "precio_unitario_colones": precio},
            fecha=fecha,
        )

    def _vistas(self, articulos: list[Articulo]) -> None:
        rng = self.rng
        hoy = self.hoy
        registros = []
        for articulo in articulos:
            base = 12 if articulo.destacado else 3
            for dia in range(DIAS_VISTAS):
                fecha = hoy - timedelta(days=dia)
                if fecha < timezone.localdate(articulo.publicado_en) or rng.random() < 0.35:
                    continue
                registros.append(
                    VistaDiaria(articulo=articulo, fecha=fecha, cantidad=rng.randint(1, base))
                )
        VistaDiaria.objects.bulk_create(registros)

    def _tipo_cambio(self) -> None:
        rng = self.rng
        hoy = self.hoy
        venta = Decimal("448.00")
        registros = []
        for dia in range(DIAS_TIPO_CAMBIO):
            venta = min(
                Decimal("452"), max(Decimal("444"), venta + Decimal(rng.randint(-80, 80)) / 100)
            )
            registros.append(
                TipoCambio(
                    fecha=hoy - timedelta(days=dia),
                    compra=venta - 6,
                    venta=venta,
                    fuente="ejemplo",
                )
            )
        TipoCambio.objects.bulk_create(registros)
