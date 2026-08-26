from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Votante
from .serializers import VotanteSerializer

@api_view(['POST'])
def buscar_votante(request):
    documento = request.data.get('documento', '').strip()
    if not documento:
        return Response({'error': 'Debe proporcionar un número de documento'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        votante = Votante.objects.get(documento=documento)
        serializer = VotanteSerializer(votante)
        return Response(serializer.data)
    except Votante.DoesNotExist:
        return Response({'error': 'El documento no se encuentra registrado en el padrón electoral'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def registrar_ingreso(request):
    documento = request.data.get('documento', '').strip()
    try:
        votante = Votante.objects.get(documento=documento)
        if votante.ingreso_registrado:
            return Response({'error': 'El ingreso de este votante ya fue registrado anteriormente'}, status=status.HTTP_400_BAD_REQUEST)
        
        votante.ingreso_registrado = True
        votante.fecha_ingreso = timezone.now()
        votante.save()
        
        serializer = VotanteSerializer(votante)
        return Response({'mensaje': 'Ingreso registrado correctamente', 'votante': serializer.data})
    except Votante.DoesNotExist:
        return Response({'error': 'Votante no encontrado'}, status=status.HTTP_404_NOT_FOUND)