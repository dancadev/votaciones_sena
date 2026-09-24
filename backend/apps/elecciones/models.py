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


class Voto(models.Model):
    """Voto secreto: no se guarda a qué votante pertenece."""
    candidato = models.ForeignKey(Candidato, on_delete=models.PROTECT, related_name='votos')
    fecha_hora = models.DateTimeField(auto_now_add=True)
