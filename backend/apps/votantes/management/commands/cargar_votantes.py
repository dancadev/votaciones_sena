"""Importa el padrón electoral de votantes desde un archivo Excel.

El archivo de origen es la **BASE DE DATOS 2026** de los aprendices del SENA,
con los encabezados en la segunda fila (la primera es un separador):

    No. | FICHA | PROGRAMA | NIVEL_DE_FORMACION | TIPO_DOCUMENTO |
    NUMERO_DOCUMENTO | NOMBRE | PRIMER_APELLIDO | SEGUNDO_APELLIDO

`No.` es solo un consecutivo del archivo, así que se ignora: la llave del
padrón es `NUMERO_DOCUMENTO`.

Uso:
    python manage.py cargar_votantes
    python manage.py cargar_votantes --archivo "BASE DE DATOS 2026.xlsx"
    python manage.py cargar_votantes --reemplazar
    python manage.py cargar_votantes --simular
"""

import os
from collections import Counter

import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.votantes.models import Votante

ARCHIVO_POR_DEFECTO = 'BASE DE DATOS 2026.xlsx'

#: Nombre canónico -> posibles encabezados en el archivo.
COLUMNAS = {
    'numero_documento': ['NUMERO_DOCUMENTO', 'NUMERO DE DOCUMENTO', 'DOCUMENTO', 'CEDULA', 'IDENTIFICACION'],
    'tipo_documento': ['TIPO_DOCUMENTO', 'TIPO DE DOCUMENTO', 'TIPO DOCUMENTO'],
    'nombre': ['NOMBRE', 'NOMBRES', 'PRIMER_NOMBRE', 'PRIMER NOMBRE'],
    'primer_apellido': ['PRIMER_APELLIDO', 'PRIMER APELLIDO', 'APELLIDO', 'APELLIDOS'],
    'segundo_apellido': ['SEGUNDO_APELLIDO', 'SEGUNDO APELLIDO'],
    'nombre_completo': ['NOMBRE_COMPLETO', 'NOMBRE COMPLETO', 'NOMBRES Y APELLIDOS'],
    'programa': ['PROGRAMA', 'PROGRAMA_O_DEPENDENCIA', 'PROGRAMA O DEPENDENCIA', 'DEPENDENCIA', 'AREA'],
    'ficha': ['FICHA', 'FICHA_DE_CARACTERIZACION', 'NUMERO_FICHA'],
    'nivel': ['NIVEL_DE_FORMACION', 'NIVEL DE FORMACION', 'NIVEL_FORMACION', 'NIVEL'],
}


def texto(valor):
    """Convierte una celda de pandas en texto limpio."""
    return '' if pd.isna(valor) else str(valor).strip()


def normalizar(valor):
    return str(valor).strip().upper().replace('\n', ' ')


def detectar_fila_de_encabezados(ruta, maximo=15):
    """Busca la fila que contiene los encabezados (en este archivo es la 2.ª)."""
    crudo = pd.read_excel(ruta, header=None, dtype=str, nrows=maximo)
    for indice in range(len(crudo)):
        valores = {normalizar(v) for v in crudo.iloc[indice].tolist() if not pd.isna(v)}
        tiene_documento = bool(valores & set(COLUMNAS['numero_documento']))
        tiene_nombre = bool(valores & set(COLUMNAS['nombre']) or valores & set(COLUMNAS['nombre_completo']))
        if tiene_documento and tiene_nombre:
            return indice
    raise CommandError(
        'No se encontró la fila de encabezados. El archivo debe tener una columna '
        'NUMERO_DOCUMENTO (o DOCUMENTO) y una de nombres.'
    )


def mapear_columnas(columnas):
    """Relaciona cada nombre canónico con la columna real del archivo."""
    disponibles = {normalizar(c): c for c in columnas}
    mapa = {}
    for canonico, alias in COLUMNAS.items():
        for posible in alias:
            if normalizar(posible) in disponibles:
                mapa[canonico] = disponibles[normalizar(posible)]
                break
    return mapa


class Command(BaseCommand):
    help = (
        'Importa y actualiza el padrón de votantes desde la BASE DE DATOS 2026 '
        '(Excel de aprendices del SENA)'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--archivo',
            type=str,
            default=ARCHIVO_POR_DEFECTO,
            help=f'Ruta del archivo Excel a importar (por defecto "{ARCHIVO_POR_DEFECTO}")',
        )
        parser.add_argument(
            '--reemplazar',
            action='store_true',
            help='Borra el padrón actual antes de importar (elimina también ingresos y marcas de voto)',
        )
        parser.add_argument(
            '--simular',
            action='store_true',
            help='Muestra lo que haría la importación sin escribir en la base de datos',
        )

    def handle(self, *args, **options):
        ruta = options['archivo']
        if not os.path.isabs(ruta):
            ruta = os.path.join(os.getcwd(), ruta)
        if not os.path.exists(ruta):
            raise CommandError(f'No se encontró el archivo: {ruta}')

        self.stdout.write(self.style.WARNING(f'Leyendo: {ruta}'))

        fila_encabezados = detectar_fila_de_encabezados(ruta)
        df = pd.read_excel(ruta, header=fila_encabezados, dtype=str)
        df = df.dropna(axis=1, how='all')
        self.stdout.write(
            f'Encabezados en la fila {fila_encabezados + 1} · '
            f'{len(df)} filas y {len(df.columns)} columnas'
        )

        mapa = mapear_columnas(df.columns)
        if 'numero_documento' not in mapa:
            raise CommandError('El archivo no tiene una columna de número de documento.')
        if 'nombre' not in mapa and 'nombre_completo' not in mapa:
            raise CommandError('El archivo no tiene columnas de nombre.')

        registros, descartados, duplicados = self._construir_registros(df, mapa)

        self.stdout.write(f'Registros válidos: {len(registros)}')
        if duplicados:
            self.stdout.write(self.style.WARNING(
                f'Documentos repetidos en el archivo: {duplicados} '
                '(se conserva el último registro de cada uno)'
            ))
        if descartados:
            self.stdout.write(self.style.WARNING(
                f'Filas descartadas por no tener documento o nombre: {descartados}'
            ))

        if options['simular']:
            self.stdout.write(self.style.WARNING(
                'Simulación: no se escribió nada en la base de datos.'
            ))
            self._resumen(registros)
            return

        with transaction.atomic():
            if options['reemplazar']:
                borrados, _ = Votante.objects.all().delete()
                self.stdout.write(self.style.WARNING(
                    f'Padrón anterior eliminado ({borrados} registros)'
                ))

            existentes = set(Votante.objects.values_list('documento', flat=True))
            nuevos = [r for r in registros if r['documento'] not in existentes]
            actualizables = [r for r in registros if r['documento'] in existentes]

            Votante.objects.bulk_create(
                [Votante(**datos) for datos in nuevos],
                batch_size=1000,
                ignore_conflicts=True,
            )
            self._actualizar(actualizables)

        self.stdout.write(self.style.SUCCESS(
            f'Importación terminada · nuevos: {len(nuevos)} · actualizados: {len(actualizables)}'
        ))
        self.stdout.write(f'Total de votantes en el padrón: {Votante.objects.count()}')
        self._resumen(registros)

    # ------------------------------------------------------------------ #

    def _construir_registros(self, df, mapa):
        """Convierte el DataFrame en registros listos para el modelo."""
        registros = {}
        descartados = 0
        duplicados = 0

        for _, fila in df.iterrows():
            columna_documento = mapa.get('numero_documento')
            documento = texto(fila.get(columna_documento)).split('.')[0]
            if not documento or documento.lower() == 'nan':
                descartados += 1
                continue

            nombre = texto(fila.get(mapa.get('nombre')))
            primer_apellido = texto(fila.get(mapa.get('primer_apellido')))
            segundo_apellido = texto(fila.get(mapa.get('segundo_apellido')))

            if mapa.get('nombre_completo'):
                nombre_completo = texto(fila.get(mapa['nombre_completo']))
            else:
                nombre_completo = ' '.join(
                    parte for parte in (nombre, primer_apellido, segundo_apellido) if parte
                )

            if not nombre_completo:
                descartados += 1
                continue

            if documento in registros:
                duplicados += 1

            registros[documento] = {
                'documento': documento,
                'tipo_documento': texto(fila.get(mapa.get('tipo_documento'))).upper()[:10],
                'nombre_completo': nombre_completo[:200],
                'primer_nombre': nombre[:120],
                'primer_apellido': primer_apellido[:120],
                'segundo_apellido': segundo_apellido[:120],
                'programa_o_dependencia': texto(fila.get(mapa.get('programa')))[:200],
                'ficha': texto(fila.get(mapa.get('ficha')))[:30],
                'nivel_de_formacion': texto(fila.get(mapa.get('nivel')))[:40],
            }

        return list(registros.values()), descartados, duplicados

    def _actualizar(self, registros):
        """Actualiza los datos personales sin tocar el estado de votación."""
        if not registros:
            return

        votantes = {
            v.documento: v
            for v in Votante.objects.filter(documento__in=[r['documento'] for r in registros])
        }
        a_guardar = []
        for datos in registros:
            votante = votantes.get(datos['documento'])
            if votante is None:
                continue
            for campo, valor in datos.items():
                setattr(votante, campo, valor)
            a_guardar.append(votante)

        if a_guardar:
            Votante.objects.bulk_update(
                a_guardar,
                [
                    'tipo_documento', 'nombre_completo', 'primer_nombre', 'primer_apellido',
                    'segundo_apellido', 'programa_o_dependencia', 'ficha', 'nivel_de_formacion',
                ],
                batch_size=1000,
            )

    def _resumen(self, registros):
        self.stdout.write('')
        self.stdout.write('Resumen del archivo:')
        for etiqueta, campo in (
            ('Tipo de documento', 'tipo_documento'),
            ('Nivel de formación', 'nivel_de_formacion'),
        ):
            conteo = Counter(r[campo] or '(vacío)' for r in registros)
            detalle = ', '.join(f'{clave}: {valor}' for clave, valor in conteo.most_common())
            self.stdout.write(f'  {etiqueta}: {detalle}')

        programas = {r['programa_o_dependencia'] for r in registros if r['programa_o_dependencia']}
        fichas = {r['ficha'] for r in registros if r['ficha']}
        self.stdout.write(f'  Programas distintos: {len(programas)}')
        self.stdout.write(f'  Fichas distintas: {len(fichas)}')
