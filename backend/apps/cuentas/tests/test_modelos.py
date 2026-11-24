import pytest
from django.db import IntegrityError

from apps.cuentas.models import Rol, Usuario
from apps.cuentas.permisos import PERMISOS_POR_ROL


def test_roles_sembrados_con_sus_permisos(db):
    assert set(Rol.objects.values_list("nombre", flat=True)) == {"admin", "colaborador", "demo"}
    for nombre, codigos in PERMISOS_POR_ROL.items():
        rol = Rol.objects.get(nombre=nombre)
        assert {rp.permiso.codigo for rp in rol.rolpermiso_set.all()} == codigos


def test_crear_usuario_normaliza_email_y_nace_inactivo(db):
    u = Usuario.objects.crear_usuario(" Ana@Garaje.TEST ", "Ana", "Mora", "colaborador")
    assert u.email == "ana@garaje.test"
    assert u.is_active is False
    assert not u.has_usable_password()


def test_email_unico(db):
    Usuario.objects.crear_usuario("dup@x.test", "A", "B", "colaborador")
    with pytest.raises(IntegrityError):
        Usuario.objects.crear_usuario("DUP@x.test", "C", "D", "colaborador")


def test_colaborador_no_borra_ni_gestiona_usuarios(db):
    c = Usuario.objects.crear_usuario("c@x.test", "C", "X", "colaborador")
    assert c.tiene_permiso("articulos.editar")
    assert not c.tiene_permiso("articulos.eliminar")
    assert not c.tiene_permiso("usuarios.gestionar")
    assert not c.es_admin


def test_demo_solo_lee(db):
    d = Usuario.objects.crear_usuario("d@x.test", "D", "X", "demo")
    assert d.codigos_permiso() == {"articulos.ver", "reportes.ver", "historial.ver"}


def test_create_user_usa_colaborador_por_defecto(db):
    u = Usuario.objects.create_user("u@x.test", "clave-Segura-123", nombre="U", apellidos="X")
    assert u.rol.nombre == "colaborador"


def test_create_superuser_es_admin_activo(db):
    a = Usuario.objects.create_superuser("a@x.test", "clave-Segura-123", nombre="A", apellidos="B")
    assert a.es_admin
    assert a.is_active
    assert a.check_password("clave-Segura-123")
    assert a.tiene_permiso("usuarios.gestionar")
