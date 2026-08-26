import pandas as pd
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.votantes.models import Votante

class Command(BaseCommand):
    help = 'Importa y actualiza la lista del padrón de votantes desde un archivo de Excel (.xlsx / .xls)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--archivo',
            type=str,
            required=True,
            help='Ruta absoluta o relativa del archivo Excel a importar'
        )

    def handle(self, *args, **options):
        ruta_archivo = options['archivo']

        self.stdout.write(self.style.WARNING(f"Leyendo archivo Excel: {ruta_archivo}..."))

        try:
            # Leer el archivo Excel usando pandas
            df = pd.read_excel(ruta_archivo)
            
            # Normalizar los nombres de las columnas a mayúsculas y quitar espacios sobrantes
            df.columns = df.columns.astype(str).str.strip().str.upper()

            # Verificar columnas requeridas
            columnas_requeridas = {'DOCUMENTO', 'NOMBRE'}
            if not columnas_requeridas.issubset(df.columns):
                # Intentar buscar variaciones comunes si no se llaman exactamente igual
                columnas_presentes = set(df.columns)
                self.stdout.write(self.style.ERROR(
                    f"Error: El archivo debe contener al menos las columnas 'DOCUMENTO' y 'NOMBRE'.\n"
                    f"Columnas encontradas: {list(columnas_presentes)}"
                ))
                return

            nuevos_votantes = []
            existentes_omitidos = 0

            # Obtener documentos que ya existen en PostgreSQL para evitar colisiones
            documentos_existentes = set(
                Votante.objects.values_list('documento', flat=True)
            )

            for index, row in df.iterrows():
                documento_val = str(row['DOCUMENTO']).strip().split('.')[0] # Limpiar decimales si vienen como float
                nombre_val = str(row['NOMBRE']).strip()
                
                # Columna opcional (Programa o Dependencia)
                dependencia_val = ''
                if 'PROGRAMA' in df.columns:
                    dependencia_val = str(row['PROGRAMA']).strip()
                elif 'DEPENDENCIA' in df.columns:
                    dependencia_val = str(row['DEPENDENCIA']).strip()
                elif 'AREA' in df.columns:
                    dependencia_val = str(row['AREA']).strip()

                if not documento_val or documento_val == 'nan':
                    continue

                if documento_val in documentos_existentes:
                    existentes_omitidos += 1
                    continue

                nuevos_votantes.append(
                    Votante(
                        documento=documento_val,
                        nombre_completo=nombre_val,
                        programa_o_dependencia=dependencia_val,
                        ingreso_registrado=False
                    )
                )

                # Registrar el documento cargado en el set temporal
                documentos_existentes.add(documento_val)

            # Insertar de forma masiva en bloques (bulk_create) para alto rendimiento
            with transaction.atomic():
                Votante.objects.bulk_create(nuevos_votantes, batch_size=1000)

            self.stdout.write(self.style.SUCCESS(
                f" ¡Proceso finalizado con éxito!\n"
                f"   • Votantes nuevos importados: {len(nuevos_votantes)}\n"
                f"   • Votantes duplicados u omitidos: {existentes_omitidos}"
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Ocurrió un error al procesar el archivo Excel: {str(e)}"))