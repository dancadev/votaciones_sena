"""Tokens temporales de votante.

El votante no tiene usuario ni contraseña: el administrador valida su cédula en
el módulo de ingreso y la cabina le entrega uno de estos tokens para que pueda
emitir su voto. El token se guarda en caché con tiempo de vida limitado y se
revoca apenas el votante sufraga.
"""

import secrets

from django.conf import settings
from django.core.cache import cache

PREFIJO = 'votante_token:'
CABECERA = 'HTTP_X_VOTANTE_TOKEN'


def _clave(token):
    return f'{PREFIJO}{token}'


def emitir(votante):
    """Genera y guarda un token temporal para el votante indicado."""
    token = secrets.token_urlsafe(32)
    cache.set(_clave(token), votante.id, timeout=settings.VOTANTE_TOKEN_TTL_SEGUNDOS)
    return token


def revocar(token):
    if token:
        cache.delete(_clave(token))


def votante_id_del_token(token):
    if not token:
        return None
    return cache.get(_clave(token))


def token_del_request(request):
    return request.META.get(CABECERA)
