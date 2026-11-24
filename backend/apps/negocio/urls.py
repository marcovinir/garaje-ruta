from django.urls import path

from . import views

urlpatterns = [
    path("configuracion/", views.ConfiguracionPublicaView.as_view(), name="configuracion"),
]
