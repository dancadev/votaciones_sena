from django.contrib import admin

from .models import Candidato, EstadoElectoral, Voto


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display = ('numero_tarjeton', 'nombre', 'configurado', 'activo', 'es_voto_blanco', 'votos_registrados')
    list_editable = ('nombre', 'activo')
    list_filter = ('activo', 'es_voto_blanco')
    search_fields = ('nombre', 'propuesta')
    ordering = ('numero_tarjeton',)

    @admin.display(description='Votos')
    def votos_registrados(self, obj):
        return obj.votos.count()

    @admin.display(boolean=True, description='Configurado')
    def configurado(self, obj):
        return obj.esta_configurado


@admin.register(EstadoElectoral)
class EstadoElectoralAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'is_activa', 'hora_cierre_votacion', 'resultados_publicos', 'fecha_cierre')


@admin.register(Voto)
class VotoAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidato', 'fecha_hora')
    list_filter = ('candidato',)
    readonly_fields = ('candidato', 'fecha_hora')

    def has_add_permission(self, request):
        # El voto se emite desde la cabina, no a mano.
        return False
