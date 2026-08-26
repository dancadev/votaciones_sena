from django.contrib import admin
from .models import Candidato, EstadoElectoral, Voto

admin.site.register(Candidato)
admin.site.register(EstadoElectoral)
admin.site.register(Voto)