"""Rutas de autenticación y perfiles: `http://127.0.0.1:8000/api/auth/`."""

from django.urls import path

from apps.elecciones import auth_views

urlpatterns = [
    path('login/', auth_views.login, name='login'),
    path('logout/', auth_views.logout, name='logout'),
    path('yo/', auth_views.usuario_actual, name='usuario_actual'),
    path('verificar-admin/', auth_views.verificar_administrador, name='verificar_administrador'),
]
