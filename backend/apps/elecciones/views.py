from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import Candidato, EstadoElectoral, Voto
from .serializers import CandidatoSerializer, EstadoElectoralSerializer

@api_view(['GET'])
def listar_candidatos(request):
    candidatos = Candidato.objects.all()
    serializer = CandidatoSerializer(candidatos, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def estado_jornada(request):
    estado, _ = EstadoElectoral.objects.get_or_create(id=1)
    serializer = EstadoElectoralSerializer(estado)
    return Response(serializer.data)

@api_view(['POST'])
def registrar_voto(request):
    estado, _ = EstadoElectoral.objects.get_or_create(id=1)
    if not estado.is_activa:
        return Response({'error': 'La jornada de votación está cerrada'}, status=status.HTTP_400_BAD_REQUEST)

    candidato_id = request.data.get('candidato_id')
    try:
        candidato = Candidato.objects.get(id=candidato_id)
        Voto.objects.create(candidato=candidato)
        return Response({'mensaje': 'Voto registrado exitosamente'}, status=status.HTTP_201_CREATED)
    except Candidato.DoesNotExist:
        return Response({'error': 'Candidato no válido'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def total_votos_realtime(request):
    total = Voto.objects.count()
    return Response({'total_votos': total})

@api_view(['GET'])
def resultados_finales(request):
    estado, _ = EstadoElectoral.objects.get_or_create(id=1)
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