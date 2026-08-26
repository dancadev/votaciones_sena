from django.db import models

class Votante(models.Model):
    documento = models.CharField(max_length=20, unique=True, db_index=True)
    nombre_completo = models.CharField(max_length=150)
    programa_o_dependencia = models.CharField(max_length=150, blank=True)
    ingreso_registrado = models.BooleanField(default=False)
    fecha_ingreso = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.documento} - {self.nombre_completo}"