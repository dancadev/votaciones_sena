from rest_framework import serializers
from .models import Candidato, EstadoElectoral, Voto

class CandidatoSerializer(serializers.ModelSerializer):
    foto = serializers.SerializerMethodField()
    esta_configurado = serializers.BooleanField(read_only=True)

    class Meta:
        model = Candidato
        fields = ['id', 'nombre', 'numero_tarjeton', 'propuesta', 'foto', 'es_voto_blanco', 'esta_configurado']

    def get_foto(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.foto.url)
            return f"http://127.0.0.1:8000{obj.foto.url}"
        return None

class EstadoElectoralSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoElectoral
        fields = ['is_activa', 'fecha_cierre']
