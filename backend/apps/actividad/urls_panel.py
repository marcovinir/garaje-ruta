from django.urls import path

from .views_panel import HistorialPanelView

urlpatterns = [
    path("historial/", HistorialPanelView.as_view(), name="panel-historial"),
]
