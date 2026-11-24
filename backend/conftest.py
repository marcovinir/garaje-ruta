import pytest


@pytest.fixture(autouse=True)
def _limpiar_throttles():
    from django.core.cache import cache

    cache.clear()
