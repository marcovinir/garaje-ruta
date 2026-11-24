from rest_framework.routers import SimpleRouter

from .views_panel import ArticuloPanelViewSet

router = SimpleRouter()
router.register("articulos", ArticuloPanelViewSet, basename="panel-articulos")

urlpatterns = router.urls
