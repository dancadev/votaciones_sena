"""Deja el tarjetón con 4 candidatos visibles y sin voto en blanco.

El tarjetón debe mostrar cuatro candidatos y el módulo de propuestas ya no
admite voto en blanco, así que:

* los cupos #1 a #4 quedan activos y visibles;
* cualquier registro marcado como voto en blanco se oculta del tarjetón y de
  las propuestas, pero NO se borra: sus votos siguen contando en el escrutinio;
* los cupos adicionales (#5 en adelante que no sean voto en blanco) se ocultan
  para que solo se vean cuatro tarjetas. No se borran, siguen disponibles.

Los votos ya emitidos se conservan en todos los casos.
"""

from django.db import migrations

NUMEROS_VISIBLES = [1, 2, 3, 4]


def configurar_tarjeton(apps, schema_editor):
    Candidato = apps.get_model('elecciones', 'Candidato')

    # El voto en blanco sale del tarjetón y de las propuestas, pero se conserva
    # para que sus votos sigan apareciendo en el escrutinio.
    Candidato.objects.filter(es_voto_blanco=True).update(activo=False)

    # Los cupos que no son voto en blanco: visibles solo el 1 al 4.
    cupos = Candidato.objects.filter(es_voto_blanco=False)
    cupos.filter(numero_tarjeton__in=NUMEROS_VISIBLES).update(activo=True)
    cupos.exclude(numero_tarjeton__in=NUMEROS_VISIBLES).update(activo=False)


def revertir(apps, schema_editor):
    Candidato = apps.get_model('elecciones', 'Candidato')
    Candidato.objects.update(activo=True)


class Migration(migrations.Migration):

    dependencies = [
        ('elecciones', '0004_candidato_activo_and_more'),
    ]

    operations = [
        migrations.RunPython(configurar_tarjeton, revertir),
    ]
