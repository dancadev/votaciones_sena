"""Prepara la jornada electoral.

Deja listo el sistema para operar:

* crea el registro de estado electoral con la hora límite (4:00 p.m. por
  defecto) y los resultados sin publicar;
* verifica que el administrador exista (se crea con `createsuperuser`);
* reporta cuántos candidatos visibles hay en el tarjetón.

Uso:
    python manage.py preparar_jornada
    python manage.py preparar_jornada --hora-cierre 16:00
"""

from datetime import datetime

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.elecciones.models import Candidato, EstadoElectoral


class Command(BaseCommand):
    help = 'Prepara el estado de la jornada electoral y verifica la configuración mínima'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hora-cierre',
            type=str,
            default=None,
            help='Hora límite de votación en formato HH:MM (por defecto 16:00)',
        )
        parser.add_argument(
            '--sin-activar',
            action='store_true',
            help='No marca la jornada como activa; solo revisa la configuración',
        )

    def handle(self, *args, **options):
        estado, creado = EstadoElectoral.objects.get_or_create(id=1)

        if options['hora_cierre']:
            try:
                estado.hora_cierre_votacion = datetime.strptime(options['hora_cierre'], '%H:%M').time()
            except ValueError as error:
                raise CommandError(f'Formato de hora inválido: {options["hora_cierre"]}. Usa HH:MM') from error

        if not options['sin_activar']:
            estado.is_activa = True
            estado.resultados_publicos = False
            estado.fecha_cierre = None

        estado.save()

        self.stdout.write(self.style.SUCCESS(
            f'Estado electoral {"creado" if creado else "actualizado"}: '
            f'jornada {"activa" if estado.is_activa else "cerrada"}, '
            f'hora límite {estado.hora_cierre_votacion:%H:%M}, '
            f'resultados {"publicados" if estado.resultados_publicos else "sin publicar"}'
        ))

        administradores = get_user_model().objects.filter(is_staff=True)
        if administradores.exists():
            self.stdout.write(self.style.SUCCESS(
                'Administradores: ' + ', '.join(administradores.values_list('username', flat=True))
            ))
        else:
            self.stdout.write(self.style.WARNING(
                'No hay administradores. Créalo con: python manage.py createsuperuser'
            ))

        visibles = Candidato.objects.filter(activo=True, es_voto_blanco=False)
        opciones = Candidato.objects.filter(es_voto_blanco=True, activo=True).first()
        self.stdout.write(f'Candidatos visibles en el tarjetón: {visibles.count()}')

        for candidato in Candidato.objects.all():
            etiqueta = 'voto en blanco' if candidato.es_voto_blanco else 'candidato'
            estado_visibilidad = 'visible' if candidato.activo else 'oculto'
            destino = ' (opción de la cabina)' if candidato.es_voto_blanco and candidato.activo else ''
            self.stdout.write(
                f'  #{candidato.numero_tarjeton} [{etiqueta}/{estado_visibilidad}] '
                f'{candidato.nombre or "(sin nombre)"}{destino}'
            )

        if visibles.count() != 4:
            self.stdout.write(self.style.WARNING(
                f'Se esperaban 4 candidatos visibles y hay {visibles.count()}. '
                'Revisa el admin de Django o el campo "Visible en el tarjetón".'
            ))

        if opciones.activo:
            self.stdout.write(self.style.SUCCESS(
                'Voto en blanco habilitado en la cabina de votación.'
            ))
        else:
            self.stdout.write(self.style.WARNING(
                'El voto en blanco está oculto: no aparecerá en la cabina. '
                'Actívalo en el admin (Candidato #%s → "Visible en el tarjetón").'
                % (opciones.numero_tarjeton if opciones else '?')
            ))
