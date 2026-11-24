from django.urls import path

from .views_panel import ConfiguracionPanelView

urlpatterns = [
    path("configuracion/", ConfiguracionPanelView.as_view(), name="panel-configuracion"),
]
