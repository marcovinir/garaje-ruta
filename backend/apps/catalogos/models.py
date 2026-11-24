"""Catálogos que el administrador amplía desde el panel sin tocar el código."""

from django.db import models


class Marca(models.Model):
    nombre = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=70, unique=True)

    class Meta:
        db_table = "marca"
        ordering = ["nombre"]

    def __str__(self) -> str:
        return self.nombre


class Modelo(models.Model):
    marca = models.ForeignKey(Marca, on_delete=models.PROTECT, related_name="modelos")
    nombre = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90)

    class Meta:
        db_table = "modelo"
        ordering = ["marca__nombre", "nombre"]
        constraints = [
            models.UniqueConstraint(fields=["marca", "nombre"], name="modelo_nombre_unico"),
            models.UniqueConstraint(fields=["marca", "slug"], name="modelo_slug_unico"),
        ]

    def __str__(self) -> str:
        return f"{self.marca.nombre} {self.nombre}"


class Transmision(models.Model):
    nombre = models.CharField(max_length=40, unique=True)

    class Meta:
        db_table = "transmision"
        ordering = ["nombre"]
        verbose_name_plural = "transmisiones"

    def __str__(self) -> str:
        return self.nombre


class Combustible(models.Model):
    nombre = models.CharField(max_length=40, unique=True)

    class Meta:
        db_table = "combustible"
        ordering = ["nombre"]

    def __str__(self) -> str:
        return self.nombre


class Traccion(models.Model):
    nombre = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = "traccion"
        ordering = ["nombre"]
        verbose_name_plural = "tracciones"

    def __str__(self) -> str:
        return self.nombre


class Carroceria(models.Model):
    """Sedán, SUV, Pickup…: también son los accesos rápidos del inicio."""

    nombre = models.CharField(max_length=40, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "carroceria"
        ordering = ["orden", "nombre"]
        verbose_name_plural = "carrocerías"

    def __str__(self) -> str:
        return self.nombre


class CategoriaPieza(models.Model):
    """Árbol de categorías de repuestos (Motor > Alternador)."""

    padre = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.PROTECT, related_name="hijas"
    )
    nombre = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90, unique=True)

    class Meta:
        db_table = "categoria_pieza"
        ordering = ["nombre"]
        verbose_name_plural = "categorías de pieza"

    def __str__(self) -> str:
        return self.nombre


class GrupoEquipamiento(models.Model):
    nombre = models.CharField(max_length=40, unique=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "grupo_equipamiento"
        ordering = ["orden", "nombre"]
        verbose_name_plural = "grupos de equipamiento"

    def __str__(self) -> str:
        return self.nombre


class Equipamiento(models.Model):
    """Aire acondicionado, cámara de retroceso… Los `filtrable` salen en «Más filtros»."""

    grupo = models.ForeignKey(
        GrupoEquipamiento, on_delete=models.PROTECT, related_name="equipamientos"
    )
    nombre = models.CharField(max_length=80, unique=True)
    orden = models.PositiveSmallIntegerField(default=0)
    filtrable = models.BooleanField(default=False)

    class Meta:
        db_table = "equipamiento"
        ordering = ["grupo__orden", "orden", "nombre"]
        verbose_name_plural = "equipamiento"

    def __str__(self) -> str:
        return self.nombre
