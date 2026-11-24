from django.urls import path
from rest_framework.routers import SimpleRouter

from .views_panel import ArticuloPanelViewSet, FirmaFotosView

router = SimpleRouter()
router.register("articulos", ArticuloPanelViewSet, basename="panel-articulos")

urlpatterns = [
    path("fotos/firma/", FirmaFotosView.as_view(), name="panel-fotos-firma"),
    *router.urls,
]
