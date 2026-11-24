from django.urls import path

from . import views

urlpatterns = [
    path("catalogos/", views.CatalogosView.as_view(), name="catalogos"),
]
