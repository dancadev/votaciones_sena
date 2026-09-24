"""Permisos compartidos de la API.

En el sistema hay dos perfiles:

* **Administrador**: usuario de Django con `is_staff`. Es el único que puede ver
  el monitor en vivo, cerrar la jornada, publicar resultados y validar el
  ingreso de los votantes.
* **Votante**: no tiene usuario ni contraseña. El administrador valida su cédula
  en el módulo de ingreso y la cabina le entrega un token temporal para votar
  una sola vez (ver `apps.votantes.tokens`).
"""

from rest_framework.permissions import BasePermission


class EsAdministrador(BasePermission):
    """Solo usuarios de Django con `is_staff` (perfil administrador)."""

    message = 'Esta sección es exclusiva del administrador.'

    def has_permission(self, request, view):
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and usuario.is_staff)
