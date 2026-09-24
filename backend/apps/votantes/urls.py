from django.urls import path

from . import views

urlpatterns = [
    # Módulo de ingreso (solo administrador)
    path('buscar/', views.buscar_votante, name='buscar_votante'),
    path('ingreso/', views.registrar_ingreso, name='registrar_ingreso'),

    # Cabina de votación (el votante valida su cédula y recibe su token)
    path('validar/', views.validar_cedula, name='validar_cedula'),
    path('sesion/', views.sesion_votante, name='sesion_votante'),
    path('cerrar-sesion/', views.cerrar_sesion_votante, name='cerrar_sesion_votante'),
]
