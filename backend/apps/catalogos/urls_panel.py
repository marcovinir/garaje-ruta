from rest_framework.routers import SimpleRouter

from . import views_panel as v

router = SimpleRouter()
router.register("marcas", v.MarcaViewSet, basename="panel-marcas")
router.register("modelos", v.ModeloViewSet, basename="panel-modelos")
router.register("categorias-pieza", v.CategoriaViewSet, basename="panel-categorias")
router.register("transmisiones", v.TransmisionViewSet, basename="panel-transmisiones")
router.register("combustibles", v.CombustibleViewSet, basename="panel-combustibles")
router.register("tracciones", v.TraccionViewSet, basename="panel-tracciones")
router.register("carrocerias", v.CarroceriaViewSet, basename="panel-carrocerias")
router.register("grupos-equipamiento", v.GrupoViewSet, basename="panel-grupos")
router.register("equipamiento", v.EquipamientoViewSet, basename="panel-equipamiento")

urlpatterns = router.urls
