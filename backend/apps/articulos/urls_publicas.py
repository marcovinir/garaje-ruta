from django.urls import path

from . import views_publicas

urlpatterns = [
    path("articulos/", views_publicas.ArticulosPublicosView.as_view(), name="articulos"),
    path("destacados/", views_publicas.DestacadosView.as_view(), name="destacados"),
]
