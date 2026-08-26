from django.urls import path
from . import views

urlpatterns = [
    path('buscar/', views.buscar_votante, name='buscar_votante'),
    path('ingreso/', views.registrar_ingreso, name='registrar_ingreso'),
]