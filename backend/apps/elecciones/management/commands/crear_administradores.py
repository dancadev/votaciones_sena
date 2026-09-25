"""Crea los usuarios administradores con contraseñas temporales seguras.

Las contraseñas se generan al azar y solo se muestran una vez, al ejecutar el
comando. Cada administrador debe cambiarla al ingresar por primera vez.

Uso:
    python manage.py crear_administradores
    python manage.py crear_administradores --usuario coordinacion --nombre "Coordinación Académica"
"""

import secrets
import string

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

Usuario = get_user_model()

#: Administradores a crear por defecto: (usuario, nombre completo).
ADMINISTRADORES_POR_DEFECTO = [
    ('coordinacion', 'Coordinación Académica'),
    ('bienestar', 'Bienestar al Aprendiz'),
]

LONGITUD_CLAVE = 14
ALFABETO = string.ascii_letters + string.digits + '!@#$%&*'


def generar_password(longitud=LONGITUD_CLAVE):
    """Contraseña aleatoria que siempre incluye mayúscula, minúscula, dígito y símbolo."""
    while True:
        clave = ''.join(secrets.choice(ALFABETO) for _ in range(longitud))
        if (any(c.islower() for c in clave) and any(c.isupper() for c in clave)
                and any(c.isdigit() for c in clave) and any(c in '!@#$%&*' for c in clave)):
            return clave


class Command(BaseCommand):
    help = 'Crea usuarios administradores (is_staff) con contraseñas temporales seguras'

    def add_arguments(self, parser):
        parser.add_argument('--usuario', type=str, default=None,
                            help='Nombre de usuario a crear (si se omite, crea los dos por defecto)')
        parser.add_argument('--nombre', type=str, default='',
                            help='Nombre completo del administrador')
        parser.add_argument('--email', type=str, default='', help='Correo del administrador')
        parser.add_argument('--superusuario', action='store_true',
                            help='Crear también como superusuario (acceso al admin completo)')

    def handle(self, *args, **options):
        if options['usuario']:
            pendientes = [(options['usuario'], options['nombre'] or options['usuario'])]
        else:
            pendientes = ADMINISTRADORES_POR_DEFECTO

        creados = []
        with transaction.atomic():
            for usuario, nombre in pendientes:
                if Usuario.objects.filter(username=usuario).exists():
                    self.stdout.write(self.style.WARNING(
                        f'  El usuario "{usuario}" ya existe: no se modificó su contraseña.'
                    ))
                    continue

                clave = generar_password()
                cuenta = Usuario.objects.create_user(
                    username=usuario,
                    password=clave,
                    email=options['email'],
                    first_name=nombre,
                )
                cuenta.is_staff = True
                cuenta.is_superuser = bool(options['superusuario'])
                cuenta.save(update_fields=['is_staff', 'is_superuser'])
                creados.append((usuario, nombre, clave))

        if not creados:
            self.stdout.write(self.style.WARNING(
                'No se creó ningún usuario nuevo. Usa --usuario para indicar otro nombre.'
            ))
            return

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Administradores creados'))
        self.stdout.write('Guarda estas contraseñas: no se vuelven a mostrar.')
        self.stdout.write('')
        self.stdout.write(f'  {"USUARIO":<18}{"CONTRASEÑA":<20}NOMBRE')
        self.stdout.write(f'  {"-" * 17:<18}{"-" * 19:<20}{"-" * 24}')
        for usuario, nombre, clave in creados:
            self.stdout.write(f'  {usuario:<18}{clave:<20}{nombre}')
        self.stdout.write('')
        self.stdout.write('Cada administrador debe cambiar su contraseña al ingresar:')
        self.stdout.write('el frontend no lo obliga, pero puede hacerse desde el admin de Django.')
        self.stdout.write('')
        self.stdout.write(f'Administradores activos: {Usuario.objects.filter(is_staff=True).count()}')
