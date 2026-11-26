from django.urls import path

from .views_panel import AutoresHistorialView, HistorialPanelView

urlpatterns = [
    path("historial/usuarios/", AutoresHistorialView.as_view(), name="panel-historial-usuarios"),
    path("historial/", HistorialPanelView.as_view(), name="panel-historial"),
]
