from django.contrib import admin

from .models import Votante


@admin.register(Votante)
class VotanteAdmin(admin.ModelAdmin):
    list_display = (
        'documento', 'tipo_documento', 'nombre_completo',
        'programa_o_dependencia', 'ficha', 'nivel_de_formacion',
        'ingreso_registrado', 'ya_voto',
    )
    # `ficha` no va en list_filter: tiene cientos de valores distintos y haría
    # muy lento el panel. Se consulta desde el buscador.
    list_filter = ('tipo_documento', 'nivel_de_formacion', 'ingreso_registrado', 'ya_voto')
    search_fields = ('documento', 'nombre_completo', 'primer_apellido', 'segundo_apellido', 'ficha')
    list_per_page = 50
    readonly_fields = ('fecha_ingreso', 'fecha_voto')
    fieldsets = (
        ('Identificación', {
            'fields': ('documento', 'tipo_documento', 'nombre_completo',
                       'primer_nombre', 'primer_apellido', 'segundo_apellido'),
        }),
        ('Formación', {
            'fields': ('programa_o_dependencia', 'ficha', 'nivel_de_formacion'),
        }),
        ('Jornada electoral', {
            'fields': ('ingreso_registrado', 'fecha_ingreso', 'ya_voto', 'fecha_voto'),
        }),
    )
