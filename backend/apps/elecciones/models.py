from django.db import models

class EstadoElectoral(models.Model):
    is_activa = models.BooleanField(default=True, verbose_name="Jornada Activa")
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Estado de la Elección"

class Candidato(models.Model):
    nombre = models.CharField(max_length=120, blank=True)
    numero_tarjeton = models.PositiveIntegerField(unique=True) # 1, 2, 3, 4... para candidatos
    propuesta = models.TextField(blank=True)
    foto = models.ImageField(upload_to='candidatos/', null=True, blank=True)
    es_voto_blanco = models.BooleanField(default=False)

    class Meta:
        ordering = ['numero_tarjeton']

    @property
    def esta_configurado(self):
        """True cuando el cupo del tarjetón ya tiene un candidato registrado."""
        return self.es_voto_blanco or bool(self.nombre.strip())

    def __str__(self):
        return f"#{self.numero_tarjeton} - {self.nombre or 'CUPO DISPONIBLE'}"

class Voto(models.Model):
    candidato = models.ForeignKey(Candidato, on_delete=models.PROTECT, related_name='votos')
    fecha_hora = models.DateTimeField(auto_now_add=True)