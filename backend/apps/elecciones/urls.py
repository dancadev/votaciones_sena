from django.urls import path
from . import views

urlpatterns = [
    path('candidatos/', views.listar_candidatos, name='listar_candidatos'),
    path('propuestas/', views.listar_propuestas, name='listar_propuestas'),
    path('estado/', views.estado_jornada, name='estado_jornada'),
    path('votar/', views.registrar_voto, name='registrar_voto'),
    path('total-realtime/', views.total_votos_realtime, name='total_votos_realtime'),
    path('resultados/', views.resultados_finales, name='resultados_finales'),
]