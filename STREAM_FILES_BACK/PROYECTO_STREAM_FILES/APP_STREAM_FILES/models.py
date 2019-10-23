from django.db import models

# Create your models here.
class Documento(models.Model):
    fichero = models.FileField(null=True)