from django.urls import path

from . import views

urlpatterns = [
    path("tipo-cambio/", views.TipoCambioView.as_view(), name="tipo-cambio"),
]
