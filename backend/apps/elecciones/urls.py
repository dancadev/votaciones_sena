"""Rutas de la API de elecciones: `http://127.0.0.1:8000/api/elecciones/`."""

from django.urls import path

from . import views

urlpatterns = [
    # Público: propuestas y micrositios (siempre habilitados)
    path('propuestas/', views.listar_propuestas, name='listar_propuestas'),
    path('tarjeton/', views.tarjeton_votacion, name='tarjeton_votacion'),
    path('candidatos/<int:candidato_id>/', views.detalle_candidato, name='detalle_candidato'),
    path('candidatos/<int:candidato_id>/plan/', views.plan_trabajo_candidato, name='plan_trabajo_candidato'),
    path('candidatos/', views.listar_candidatos, name='listar_candidatos'),
    path('estado/', views.estado_jornada, name='estado_jornada'),

    # Votación
    path('votar/', views.registrar_voto, name='registrar_voto'),

    # Administrador
    path('total-realtime/', views.total_votos_realtime, name='total_votos_realtime'),
    path('configuracion/', views.configuracion_jornada, name='configuracion_jornada'),
    path('cerrar-jornada/', views.cerrar_jornada, name='cerrar_jornada'),
    path('reabrir-jornada/', views.reabrir_jornada, name='reabrir_jornada'),

    # Resultados (administrador y votantes, según publicación)
    path('resultados/', views.resultados_finales, name='resultados_finales'),
    path('resultados/pdf/', views.resultados_pdf, name='resultados_pdf'),
]
