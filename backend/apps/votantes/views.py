"""Vistas de la API para el padrón de votantes."""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.elecciones.permissions import EsAdministrador

from . import tokens
from .models import Votante
from .serializers import VotanteSerializer


def estado_para_votante(votante):
    """Resume si el votante está habilitado para pasar a la cabina."""
    if votante.ya_voto:
        return {
            'habilitado': False,
            'motivo': 'ya_voto',
            'mensaje': 'Esta cédula ya registró un voto en esta jornada.',
        }
    if not votante.ingreso_registrado:
        return {
            'habilitado': False,
            'motivo': 'sin_ingreso',
            'mensaje': (
                'Tu ingreso aún no ha sido validado por el administrador. '
                'Acércate al módulo de registro para habilitar tu voto.'
            ),
        }
    return {
        'habilitado': True,
        'motivo': 'habilitado',
        'mensaje': 'Cédula validada. Puedes pasar a la cabina de votación.',
    }


@api_view(['POST'])
@permission_classes([EsAdministrador])
def buscar_votante(request):
    """Consulta una cédula en el padrón (módulo de ingreso, solo administrador)."""
    documento = str(request.data.get('documento', '')).strip()
    if not documento:
        return Response({'error': 'Debe proporcionar un número de documento'}, status=status.HTTP_400_BAD_REQUEST)

    votante = Votante.objects.filter(documento=documento).first()
    if votante is None:
        return Response(
            {'error': 'El documento no se encuentra registrado en el padrón electoral'},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        **VotanteSerializer(votante).data,
        'estado_voto': estado_para_votante(votante),
    })


@api_view(['POST'])
@permission_classes([EsAdministrador])
def registrar_ingreso(request):
    """El administrador valida la cédula y habilita al votante para votar."""
    documento = str(request.data.get('documento', '')).strip()
    votante = Votante.objects.filter(documento=documento).first()

    if votante is None:
        return Response({'error': 'Votante no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if votante.ya_voto:
        return Response(
            {'error': 'Esta cédula ya registró un voto en esta jornada'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if votante.ingreso_registrado:
        return Response(
            {'error': 'El ingreso de este votante ya fue registrado anteriormente'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    votante.ingreso_registrado = True
    votante.fecha_ingreso = timezone.now()
    votante.save(update_fields=['ingreso_registrado', 'fecha_ingreso'])

    return Response({
        'mensaje': 'Ingreso validado. El votante ya puede pasar a la cabina.',
        'votante': VotanteSerializer(votante).data,
        'estado_voto': estado_para_votante(votante),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def validar_cedula(request):
    """La cabina valida la cédula y, si está autorizada, entrega el token de voto."""
    documento = str(request.data.get('documento', '')).strip()
    if not documento:
        return Response({'error': 'Debe proporcionar un número de documento'}, status=status.HTTP_400_BAD_REQUEST)

    votante = Votante.objects.filter(documento=documento).first()
    if votante is None:
        return Response(
            {'error': 'El documento no se encuentra registrado en el padrón electoral'},
            status=status.HTTP_404_NOT_FOUND,
        )

    estado = estado_para_votante(votante)
    if not estado['habilitado']:
        return Response({'error': estado['mensaje'], 'estado_voto': estado}, status=status.HTTP_403_FORBIDDEN)

    token = tokens.emitir(votante)
    return Response({
        'mensaje': estado['mensaje'],
        'token_votante': token,
        'votante': VotanteSerializer(votante).data,
        'estado_voto': estado,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def sesion_votante(request):
    """Devuelve el votante dueño del token enviado (para refrescar la cabina)."""
    votante_id = tokens.votante_id_del_token(tokens.token_del_request(request))
    votante = Votante.objects.filter(id=votante_id).first() if votante_id else None

    if votante is None:
        return Response({'error': 'La sesión de votación expiró'}, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        'votante': VotanteSerializer(votante).data,
        'estado_voto': estado_para_votante(votante),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def cerrar_sesion_votante(request):
    """Descarta el token del votante (por ejemplo, al entregar la cabina)."""
    tokens.revocar(tokens.token_del_request(request))
    return Response({'mensaje': 'Sesión de votación finalizada'})
