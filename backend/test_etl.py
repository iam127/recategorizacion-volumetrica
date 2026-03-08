import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

import traceback
from operaciones.etl import cargar_excel, limpiar_datos, ejecutar_recategorizacion

archivo = r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202507.xlsx'

try:
    df_l, df_f = cargar_excel(archivo)
    print("✓ cargar_excel OK")
    df_l, df_f = limpiar_datos(df_l, df_f)
    print("✓ limpiar_datos OK")
    c2, c3, c4, c5 = ejecutar_recategorizacion(df_l, df_f)
    print("✓ ejecutar_recategorizacion OK")
    print("  Clientes:", len(c2))
    print("  No aptos:", len(c4))
    print("  Anomalías:", len(c5))
    print("\nCuadro 2 muestra:")
    print(c2.head(3).to_string())
except Exception as e:
    traceback.print_exc()