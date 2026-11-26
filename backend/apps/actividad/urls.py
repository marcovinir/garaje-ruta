from django.urls import path

from . import views
from .views_eventos import EventosView

urlpatterns = [
    path("eventos/", EventosView.as_view(), name="eventos"),
    path("tipo-cambio/", views.TipoCambioView.as_view(), name="tipo-cambio"),
    path("vistas/<int:pk>/", views.VistasView.as_view(), name="vistas"),
]
