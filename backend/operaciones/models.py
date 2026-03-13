from django.db import models
from django.conf import settings


class ResultadoImportacion(models.Model):
    usuario             = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='importaciones')
    fecha_importacion   = models.DateTimeField(auto_now_add=True)
    total_registros     = models.IntegerField(default=0)
    procesados          = models.IntegerField(default=0)
    recategorizados     = models.IntegerField(default=0)
    sin_cambios         = models.IntegerField(default=0)
    no_aptos            = models.IntegerField(default=0)
    anomalias           = models.IntegerField(default=0)

    class Meta:
        db_table = 'resultado_importacion'
        ordering = ['-fecha_importacion']

    def __str__(self):
        return f"Importación {self.fecha_importacion.strftime('%Y-%m-%d %H:%M')}"


class Cliente(models.Model):
    importacion         = models.ForeignKey(ResultadoImportacion, on_delete=models.CASCADE, related_name='clientes')
    instalacion         = models.CharField(max_length=50)
    cuenta_contrato     = models.CharField(max_length=50)
    total_dias_consumo  = models.FloatField(default=0)
    total_consumo       = models.FloatField(default=0)
    promedio_diario     = models.FloatField(default=0)
    promedio_mensual    = models.FloatField(default=0)
    tarifa_anterior     = models.CharField(max_length=20)
    tarifa_nueva        = models.CharField(max_length=20)
    estado              = models.CharField(max_length=20)
    porcion             = models.CharField(max_length=50, blank=True, null=True)
    unidad_predial      = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'clientes'

    def __str__(self):
        return f"{self.instalacion} - {self.tarifa_nueva}"


class ConsumoMensual(models.Model):
    """Detalle mensual de consumo por cliente — permite filtrar por fecha y porción"""
    importacion     = models.ForeignKey(ResultadoImportacion, on_delete=models.CASCADE, related_name='consumos_mensuales')
    cliente         = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='consumos_mensuales', null=True, blank=True)
    cuenta_contrato = models.CharField(max_length=50)
    instalacion     = models.CharField(max_length=50)
    porcion         = models.CharField(max_length=50, blank=True, null=True)
    periodo         = models.CharField(max_length=7)   # formato YYYY-MM
    consumo         = models.FloatField(default=0)
    dias            = models.IntegerField(default=0)
    tarifa          = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table  = 'consumo_mensual'
        ordering  = ['periodo']
        indexes   = [
            models.Index(fields=['importacion', 'periodo']),
            models.Index(fields=['importacion', 'porcion']),
        ]

    def __str__(self):
        return f"{self.instalacion} - {self.periodo}: {self.consumo}"


class ResumenTarifario(models.Model):
    importacion         = models.ForeignKey(ResultadoImportacion, on_delete=models.CASCADE, related_name='resumenes')
    tarifa_anterior     = models.CharField(max_length=20)
    tarifa_nueva        = models.CharField(max_length=20)
    cantidad_clientes   = models.IntegerField(default=0)
    porcentaje          = models.FloatField(default=0)

    class Meta:
        db_table = 'resumen_tarifario'

    def __str__(self):
        return f"{self.tarifa_anterior} → {self.tarifa_nueva}: {self.cantidad_clientes}"


class ClienteNoApto(models.Model):
    importacion         = models.ForeignKey(ResultadoImportacion, on_delete=models.CASCADE, related_name='clientes_no_aptos')
    cuenta_contrato     = models.CharField(max_length=50)
    instalacion         = models.CharField(max_length=50)
    tarifa_referencia   = models.CharField(max_length=20, blank=True, null=True)
    observacion         = models.TextField()
    porcion             = models.CharField(max_length=50, blank=True, null=True)
    unidad_predial      = models.CharField(max_length=50, blank=True, null=True)
    meses_en_ventana    = models.FloatField(blank=True, null=True)
    estado_inicial      = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'clientes_no_aptos'

    def __str__(self):
        return f"{self.instalacion} - {self.observacion[:50]}"


class Anomalia(models.Model):
    importacion         = models.ForeignKey(ResultadoImportacion, on_delete=models.CASCADE, related_name='anomalias_lista')
    cuenta_contrato     = models.CharField(max_length=50)
    instalacion         = models.CharField(max_length=50)
    fecha               = models.DateField(blank=True, null=True)
    tipo_anomalia       = models.TextField()

    class Meta:
        db_table = 'anomalias'

    def __str__(self):
        return f"{self.instalacion} - {self.tipo_anomalia[:50]}"