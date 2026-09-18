"""Crea los cupos #5 y #6 del tarjetón electoral.

Los cupos se crean SIN nombre, sin propuesta y sin foto: son espacios libres que
quedan disponibles en el tarjetón y en el módulo de propuestas hasta que se
registren los dos candidatos adicionales desde el admin de Django.

Mientras un cupo siga vacío:
  * el tarjetón y el módulo de propuestas lo muestran como "Cupo disponible",
  * el botón de votar aparece deshabilitado,
  * la API rechaza cualquier voto enviado a ese cupo.
"""

from django.db import migrations

NUMEROS_TARJETON_NUEVOS = [5, 6]


def crear_cupos(apps, schema_editor):
    Candidato = apps.get_model('elecciones', 'Candidato')
    for numero in NUMEROS_TARJETON_NUEVOS:
        Candidato.objects.get_or_create(
            numero_tarjeton=numero,
            defaults={
                'nombre': '',
                'propuesta': '',
                'es_voto_blanco': False,
            },
        )


def eliminar_cupos(apps, schema_editor):
    Candidato = apps.get_model('elecciones', 'Candidato')
    # Solo se eliminan los cupos que siguen vacíos, para no borrar candidatos
    # ya registrados (ni sus votos) al revertir la migración.
    Candidato.objects.filter(
        numero_tarjeton__in=NUMEROS_TARJETON_NUEVOS,
        nombre='',
        es_voto_blanco=False,
        votos__isnull=True,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('elecciones', '0002_alter_candidato_nombre'),
    ]

    operations = [
        migrations.RunPython(crear_cupos, eliminar_cupos),
    ]
