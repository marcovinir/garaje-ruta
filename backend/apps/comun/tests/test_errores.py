import pytest
from django.http import Http404
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView


class CorreoSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VistaValida(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        CorreoSerializer(data=request.data).is_valid(raise_exception=True)


class VistaNoExiste(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raise Http404


def test_error_validacion_tiene_forma_estandar():
    r = VistaValida.as_view()(APIRequestFactory().post("/x/", {"email": "no"}, format="json"))
    assert r.status_code == 400
    assert r.data["detalle"] == "Revisá los datos marcados."
    assert list(r.data["campos"]) == ["email"]
    assert isinstance(r.data["campos"]["email"][0], str)


def test_error_404_tiene_forma_estandar():
    r = VistaNoExiste.as_view()(APIRequestFactory().get("/x/"))
    assert r.status_code == 404
    assert set(r.data) == {"detalle", "campos"}
    assert r.data["campos"] == {}
    assert r.data["detalle"]


class ContactoSerializer(serializers.Serializer):
    email = serializers.EmailField()
    nombre = serializers.CharField()


class ArticuloSerializer(serializers.Serializer):
    precio = serializers.IntegerField()
    contacto = ContactoSerializer()


class VistaAnidada(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ArticuloSerializer(data=request.data).is_valid(raise_exception=True)


def test_error_anidado_se_aplana_con_punto():
    datos = {"precio": "x", "contacto": {"email": "no", "nombre": "Ana"}}
    r = VistaAnidada.as_view()(APIRequestFactory().post("/x/", datos, format="json"))
    assert r.status_code == 400
    assert set(r.data["campos"]) == {"precio", "contacto.email"}
    assert r.data["campos"]["contacto.email"] == [
        "Introduzca una dirección de correo electrónico válida."
    ]


@pytest.mark.parametrize("error", [ConnectionError, TimeoutError])
def test_una_falla_fuera_del_correo_conserva_su_excepcion(error):
    class VistaConFalla(APIView):
        permission_classes = [AllowAny]

        def get(self, request):
            raise error("Falló una consulta fuera del correo")

    with pytest.raises(error, match="fuera del correo"):
        VistaConFalla.as_view()(APIRequestFactory().get("/x/"))
