from datetime import time

import pytest
from django.db import IntegrityError, transaction

from apps.negocio.models import ConfiguracionNegocio, HorarioAtencion


def test_configuracion_inicial(db):
    config = ConfiguracionNegocio.obtener()
    assert config.pk == 1
    assert config.nombre == "Garaje Ruta"
    assert config.whatsapp == "50600000000"
    assert config.horarios.count() == 6
    sabado = config.horarios.get(dia_semana=5)
    assert (sabado.apertura, sabado.cierre) == (time(8), time(12))


def test_solo_una_configuracion(db):
    with pytest.raises(IntegrityError), transaction.atomic():
        ConfiguracionNegocio.objects.create(id=2, nombre="Otro", whatsapp="1", direccion="x")


def test_horario_apertura_antes_cierre(db):
    config = ConfiguracionNegocio.obtener()
    with pytest.raises(IntegrityError), transaction.atomic():
        HorarioAtencion.objects.create(
            configuracion=config, dia_semana=6, apertura=time(12), cierre=time(8)
        )


def test_horario_dia_valido(db):
    config = ConfiguracionNegocio.obtener()
    with pytest.raises(IntegrityError), transaction.atomic():
        HorarioAtencion.objects.create(
            configuracion=config, dia_semana=7, apertura=time(8), cierre=time(12)
        )
