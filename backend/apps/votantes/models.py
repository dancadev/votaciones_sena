from django.db import models


class TipoDocumento(models.TextChoices):
    """Tipos de documento que trae la 'BASE DE DATOS 2026'."""

    CC = 'CC', 'Cédula de ciudadanía'
    TI = 'TI', 'Tarjeta de identidad'
    CE = 'CE', 'Cédula de extranjería'
    PPT = 'PPT', 'Permiso por protección temporal'


class Votante(models.Model):
    """Persona del padrón electoral.

    Los datos provienen de la 'BASE DE DATOS 2026' (aprendices del SENA), que
    trae número y tipo de documento, nombres y apellidos por separado, programa
    de formación, ficha y nivel de formación.
    """

    documento = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Número de documento',
    )
    tipo_documento = models.CharField(
        max_length=10,
        blank=True,
        choices=TipoDocumento.choices,
        verbose_name='Tipo de documento',
    )
    nombre_completo = models.CharField(max_length=200, db_index=True)
    #: Nombres y apellidos se guardan por separado para poder reconstruir el
    #: nombre completo tal como viene en el archivo original.
    primer_nombre = models.CharField(max_length=120, blank=True)
    primer_apellido = models.CharField(max_length=120, blank=True)
    segundo_apellido = models.CharField(max_length=120, blank=True)
    #: Programa de formación (el nombre `programa_o_dependencia` se conserva
    #: porque el resto del sistema ya lo usa).
    programa_o_dependencia = models.CharField(max_length=200, blank=True)
    ficha = models.CharField(max_length=30, blank=True, db_index=True, verbose_name='Ficha')
    nivel_de_formacion = models.CharField(max_length=40, blank=True, verbose_name='Nivel de formación')

    ingreso_registrado = models.BooleanField(default=False)
    fecha_ingreso = models.DateTimeField(null=True, blank=True)
    ya_voto = models.BooleanField(
        default=False,
        verbose_name="Ya sufragó",
        help_text="Se marca al registrar el voto. El voto sigue siendo secreto: no se guarda por quién votó.",
    )
    fecha_voto = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Votante'
        verbose_name_plural = 'Votantes del padrón'
        ordering = ['nombre_completo']

    def __str__(self):
        return f"{self.documento} - {self.nombre_completo}"
