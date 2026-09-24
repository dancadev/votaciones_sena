from rest_framework import serializers

from .models import Votante


class VotanteSerializer(serializers.ModelSerializer):
    """Perfil del votante que consume el módulo de ingreso y la cabina."""

    tipo_documento_display = serializers.CharField(
        source='get_tipo_documento_display', read_only=True
    )

    class Meta:
        model = Votante
        fields = [
            'id',
            'documento',
            'tipo_documento',
            'tipo_documento_display',
            'nombre_completo',
            'primer_nombre',
            'primer_apellido',
            'segundo_apellido',
            'programa_o_dependencia',
            'ficha',
            'nivel_de_formacion',
            'ingreso_registrado',
            'fecha_ingreso',
            'ya_voto',
            'fecha_voto',
        ]
