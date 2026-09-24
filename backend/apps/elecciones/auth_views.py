"""Autenticación del administrador y de los votantes.

El administrador entra con usuario y contraseña de Django y recibe un token con
el que la API protege las secciones restringidas. El votante solo obtiene un
token temporal después de que el administrador valida su cédula en el módulo de
ingreso (`apps.votantes.views`).
"""

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.elecciones.permissions import EsAdministrador

#: Roles que el frontend usa para decidir qué componentes mostrar.
ROL_ADMINISTRADOR = 'administrador'
ROL_VOTANTE = 'votante'


def datos_usuario(usuario):
    return {
        'id': usuario.id,
        'username': usuario.get_username(),
        'nombre_completo': usuario.get_full_name() or usuario.get_username(),
        'email': usuario.email,
        'rol': ROL_ADMINISTRADOR if usuario.is_staff else ROL_VOTANTE,
        'es_administrador': usuario.is_staff,
        'es_superusuario': usuario.is_superuser,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Inicio de sesión del administrador con usuario y contraseña de Django."""
    username = str(request.data.get('username', '')).strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response(
            {'error': 'Debes indicar usuario y contraseña'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = authenticate(request, username=username, password=password)
    if usuario is None:
        return Response(
            {'error': 'Usuario o contraseña incorrectos'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not usuario.is_staff:
        return Response(
            {'error': 'Esta cuenta no tiene perfil de administrador'},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=usuario)
    return Response({'token': token.key, 'usuario': datos_usuario(usuario)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Cierra la sesión del administrador invalidando su token."""
    Token.objects.filter(user=request.user).delete()
    return Response({'mensaje': 'Sesión cerrada correctamente'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    """Devuelve el perfil autenticado; el frontend lo usa al recargar la página."""
    return Response({'usuario': datos_usuario(request.user)})


@api_view(['GET'])
@permission_classes([EsAdministrador])
def verificar_administrador(request):
    """Comprueba que el token corresponde a un administrador."""
    return Response({
        'es_administrador': True,
        'usuario': datos_usuario(request.user),
    })
