from django.urls import path

from . import views_publicas

urlpatterns = [
    path("articulos/", views_publicas.ArticulosPublicosView.as_view(), name="articulos"),
    path("articulos/<int:pk>/", views_publicas.FichaView.as_view(), name="ficha"),
    path(
        "articulos/<int:pk>/similares/",
        views_publicas.SimilaresView.as_view(),
        name="similares",
    ),
    path("sitemap/", views_publicas.SitemapView.as_view(), name="sitemap"),
    path("destacados/", views_publicas.DestacadosView.as_view(), name="destacados"),
]
