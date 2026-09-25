from django.contrib import admin
from django.utils.safestring import mark_safe

from .models import Candidato, EstadoElectoral, PlanTrabajo, Voto


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display = ('numero_tarjeton', 'nombre', 'configurado', 'activo', 'es_voto_blanco', 'plan', 'votos_registrados')
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

    @admin.display(description='Plan de trabajo')
    def plan(self, obj):
        plan = getattr(obj, 'plan_trabajo', None)
        if plan is None:
            return '—'
        return f'{plan.total_secciones} secciones'


@admin.register(PlanTrabajo)
class PlanTrabajoAdmin(admin.ModelAdmin):
    list_display = ('candidato', 'titulo', 'eslogan', 'total_secciones', 'publicado', 'actualizado')
    list_filter = ('publicado',)
    search_fields = ('candidato__nombre', 'titulo', 'eslogan')
    readonly_fields = ('resumen_secciones', 'actualizado')
    fieldsets = (
        ('Candidatura', {
            'fields': ('candidato', 'titulo', 'eslogan', 'lema', 'vigencia'),
        }),
        ('Contenido', {
            'fields': ('secciones', 'resumen_secciones'),
            'description': (
                'El plan se guarda como secciones estructuradas. La forma recomendada de cargarlo '
                'es con el comando: manage.py cargar_plan_trabajo --candidato <id> --archivo plan.json'
            ),
        }),
        ('Publicación', {
            'fields': ('publicado', 'actualizado'),
        }),
    )

    @admin.display(description='Secciones')
    def total_secciones(self, obj):
        return obj.total_secciones

    @admin.display(description='Estructura cargada')
    def resumen_secciones(self, obj):
        """Muestra el índice del documento: ayuda a revisar sin leer el JSON."""
        if not obj or not obj.secciones:
            return 'Sin secciones cargadas.'

        filas = []
        for seccion in obj.secciones:
            sangria = '&nbsp;&nbsp;&nbsp;&nbsp;' if seccion.get('nivel', 1) > 1 else ''
            tipos = ', '.join(bloque.get('tipo', '?') for bloque in seccion.get('bloques', []))
            proyecto = f" — proyecto: {seccion['proyecto']}" if seccion.get('proyecto') else ''
            filas.append(
                f'{sangria}<li><strong>{seccion.get("numero", "")}</strong> '
                f'{seccion.get("titulo", "")}{proyecto} '
                f'<em style="color:#666">({tipos})</em></li>'
            )
        return mark_safe(
            f'<p>{obj.total_secciones} secciones.</p>'
            f'<ol style="line-height:1.7">{"".join(filas)}</ol>'
        )


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
