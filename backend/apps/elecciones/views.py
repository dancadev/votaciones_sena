from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import Candidato, EstadoElectoral, Voto
from .serializers import CandidatoSerializer, EstadoElectoralSerializer


def _obtener_estado():
    estado, _ = EstadoElectoral.objects.get_or_create(id=1)
    return estado


def _candidatos_con_votos_si_cerro(estado):
    """Anota los votos por candidato solo si la jornada ya cerró.

    Antes del cierre se devuelve la lista sin conteos para no filtrar
    resultados parciales por la API pública.
    """
    candidatos = Candidato.objects.all()
    if not estado.is_activa:
        candidatos = candidatos.annotate(total_votos=Count('votos'))
    return candidatos


@api_view(['GET'])
def listar_candidatos(request):
    """Tarjetón completo: candidatos, voto en blanco y cupos aún disponibles."""
    estado = _obtener_estado()
    candidatos = _candidatos_con_votos_si_cerro(estado)
    serializer = CandidatoSerializer(candidatos, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def listar_propuestas(request):
    """Módulo de propuestas: los mismos cupos del tarjetón con su propuesta completa."""
    estado = _obtener_estado()
    candidatos = _candidatos_con_votos_si_cerro(estado)
    serializer = CandidatoSerializer(candidatos, many=True, context={'request': request})

    data = serializer.data
    if not estado.is_activa:
        for item, candidato in zip(data, candidatos):
            item['votos'] = candidato.total_votos

    return Response({
        'propuestas': data,
        'jornada_activa': estado.is_activa,
        'total_candidatos': sum(1 for c in candidatos if c.esta_configurado and not c.es_voto_blanco),
        'cupos_disponibles': sum(1 for c in candidatos if not c.esta_configurado),
    })


@api_view(['GET'])
def estado_jornada(request):
    estado = _obtener_estado()
    serializer = EstadoElectoralSerializer(estado)
    return Response(serializer.data)


@api_view(['POST'])
def registrar_voto(request):
    estado = _obtener_estado()
    if not estado.is_activa:
        return Response({'error': 'La jornada de votación está cerrada'}, status=status.HTTP_400_BAD_REQUEST)

    candidato_id = request.data.get('candidato_id')
    try:
        candidato = Candidato.objects.get(id=candidato_id)
    except (Candidato.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Candidato no válido'}, status=status.HTTP_404_NOT_FOUND)

    if not candidato.esta_configurado:
        return Response(
            {'error': f'El cupo #{candidato.numero_tarjeton} del tarjetón aún no tiene candidato registrado'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    Voto.objects.create(candidato=candidato)
    return Response({'mensaje': 'Voto registrado exitosamente'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def total_votos_realtime(request):
    total = Voto.objects.count()
    return Response({'total_votos': total})


@api_view(['GET'])
def resultados_finales(request):
    estado = _obtener_estado()
    if estado.is_activa:
        return Response({'error': 'Los resultados detallados solo están disponibles al cerrar las votaciones'}, status=status.HTTP_403_FORBIDDEN)

    candidatos = Candidato.objects.annotate(total_votos=Count('votos')).order_by('-total_votos')
    data = [
        {
            'id': c.id,
            'nombre': c.nombre,
            'numero_tarjeton': c.numero_tarjeton,
            'es_voto_blanco': c.es_voto_blanco,
            'votos': c.total_votos
        } for c in candidatos
    ]
    return Response({'resultados': data, 'ganador': data[0] if data else None})
