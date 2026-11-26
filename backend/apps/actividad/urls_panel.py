from django.urls import path

from .reportes import ReportesPanelView
from .views_panel import HistorialPanelView

urlpatterns = [
    path("reportes/", ReportesPanelView.as_view(), name="panel-reportes"),
    path("historial/", HistorialPanelView.as_view(), name="panel-historial"),
]
