from rest_framework import serializers

from .models import Candidato, EstadoElectoral, PlanTrabajo, Voto


class CandidatoSerializer(serializers.ModelSerializer):
    foto = serializers.SerializerMethodField()
    esta_configurado = serializers.BooleanField(read_only=True)
    tiene_plan_trabajo = serializers.SerializerMethodField()

    class Meta:
        model = Candidato
        fields = [
            'id', 'nombre', 'numero_tarjeton', 'propuesta', 'foto',
            'es_voto_blanco', 'esta_configurado', 'tiene_plan_trabajo',
        ]

    def get_foto(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.foto.url)
            return f"http://127.0.0.1:8000{obj.foto.url}"
        return None

    def get_tiene_plan_trabajo(self, obj):
        """True si el candidato tiene un plan de trabajo publicado.

        Se calcula sin traer el plan completo: las tarjetas del módulo de
        propuestas solo necesitan saber si el botón al plan debe aparecer.
        """
        plan = getattr(obj, 'plan_trabajo', None)
        return bool(plan and plan.publicado and plan.secciones)


class PlanTrabajoSerializer(serializers.ModelSerializer):
    """Plan de trabajo completo, con sus secciones estructuradas."""

    candidato = CandidatoSerializer(read_only=True)
    total_secciones = serializers.IntegerField(read_only=True)

    class Meta:
        model = PlanTrabajo
        fields = [
            'id', 'titulo', 'eslogan', 'lema', 'vigencia',
            'secciones', 'total_secciones', 'publicado', 'actualizado', 'candidato',
        ]


class EstadoElectoralSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoElectoral
        fields = ['is_activa', 'fecha_cierre']
