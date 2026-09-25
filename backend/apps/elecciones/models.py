from django.db import models


class EstadoElectoral(models.Model):
    is_activa = models.BooleanField(default=True, verbose_name="Jornada Activa")
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    hora_cierre_votacion = models.TimeField(
        default='16:00',
        verbose_name="Hora límite de votación",
        help_text="Después de esta hora el administrador puede cerrar la jornada y habilitar los resultados.",
    )
    resultados_publicos = models.BooleanField(
        default=False,
        verbose_name="Resultados publicados",
        help_text="Habilita la consulta de resultados para administradores y votantes.",
    )

    class Meta:
        verbose_name = "Estado de la Elección"

    def __str__(self):
        return "Jornada activa" if self.is_activa else "Jornada cerrada"


class Candidato(models.Model):
    nombre = models.CharField(max_length=120, blank=True)
    numero_tarjeton = models.PositiveIntegerField(unique=True)  # 1, 2, 3, 4... del tarjetón
    propuesta = models.TextField(blank=True)
    foto = models.ImageField(upload_to='candidatos/', null=True, blank=True)
    es_voto_blanco = models.BooleanField(default=False)
    activo = models.BooleanField(
        default=True,
        verbose_name="Visible en el tarjetón",
        help_text="Desmárcalo para ocultar el cupo del tarjetón sin borrar sus votos.",
    )

    class Meta:
        ordering = ['numero_tarjeton']

    @property
    def esta_configurado(self):
        """True cuando el cupo del tarjetón ya tiene un candidato registrado."""
        return self.es_voto_blanco or bool(self.nombre.strip())

    def __str__(self):
        return f"#{self.numero_tarjeton} - {self.nombre or 'CUPO DISPONIBLE'}"


class PlanTrabajo(models.Model):
    """Plan de trabajo de una candidatura.

    El documento se guarda como una lista de **secciones estructuradas** en
    lugar de un solo bloque de texto, porque los planes combinan párrafos,
    listas, tablas (matriz de ejecución, cronograma) y bloques destacados
    (compromiso, mensaje de campaña).

    Formato de cada sección (ver `DOCUMENTACION_PLAN` en el comando
    `cargar_plan_trabajo`):

        {"numero": "6.1", "titulo": "...", "nivel": 2, "bloques": [...]}

    Bloques admitidos:

    * `{"tipo": "parrafo", "texto": "..."}`
    * `{"tipo": "lista", "items": [...], "estilo": "vinetas" | "numeros"}`
    * `{"tipo": "destacado", "texto": "...", "etiqueta": "..."}`
    * `{"tipo": "secuencia", "items": [...]}`
    * `{"tipo": "tabla", "columnas": [...], "filas": [[...], ...]}`
    """

    candidato = models.OneToOneField(
        Candidato,
        on_delete=models.CASCADE,
        related_name='plan_trabajo',
        verbose_name='Candidato',
    )
    titulo = models.CharField(max_length=200, verbose_name='Título del plan')
    eslogan = models.CharField(max_length=250, blank=True, verbose_name='Eslogan de campaña')
    lema = models.CharField(
        max_length=250, blank=True,
        verbose_name='Lema',
        help_text='Frase corta que acompaña al eslogan, por ejemplo "Escuchar • Gestionar • Hacer seguimiento".',
    )
    vigencia = models.CharField(max_length=60, blank=True, verbose_name='Vigencia')
    secciones = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Secciones del plan',
        help_text='Lista de secciones estructuradas del documento.',
    )
    publicado = models.BooleanField(
        default=True,
        verbose_name='Publicado',
        help_text='Si está desmarcado, el plan no se muestra en el micrositio.',
    )
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Plan de trabajo'
        verbose_name_plural = 'Planes de trabajo'

    def __str__(self):
        return f'Plan de trabajo · {self.candidato.nombre}'

    @property
    def total_secciones(self):
        return len(self.secciones or [])


class Voto(models.Model):
    """Voto secreto: no se guarda a qué votante pertenece."""
    candidato = models.ForeignKey(Candidato, on_delete=models.PROTECT, related_name='votos')
    fecha_hora = models.DateTimeField(auto_now_add=True)
