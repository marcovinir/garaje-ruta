from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("apps.comun.urls")),
    path("api/v1/", include("apps.articulos.urls_publicas")),
    path("api/v1/", include("apps.catalogos.urls")),
    path("api/v1/", include("apps.negocio.urls")),
    path("api/v1/", include("apps.actividad.urls")),
    path("api/v1/auth/", include("apps.cuentas.urls")),
    path("api/v1/panel/", include("apps.cuentas.urls_panel")),
    path("api/v1/panel/", include("apps.articulos.urls_panel")),
    path("api/v1/panel/", include("apps.catalogos.urls_panel")),
    path("api/v1/panel/", include("apps.negocio.urls_panel")),
    path("api/v1/panel/", include("apps.actividad.urls_panel")),
]
