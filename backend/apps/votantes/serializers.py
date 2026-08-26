from rest_framework import serializers
from .models import Votante

class VotanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Votante
        fields = ['id', 'documento', 'nombre_completo', 'programa_o_dependencia', 'ingreso_registrado', 'fecha_ingreso']