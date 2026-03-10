import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

import traceback
import pandas as pd
from operaciones.etl import cargar_excel, limpiar_datos, ejecutar_recategorizacion

archivos = [
    r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202507.xlsx',
    r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202508.xlsx',
    r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202509.xlsx',
    r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202510.xlsx',
    r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202511.xlsx',
    r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202512.xlsx',
    r'C:\Contugas Excel\BD - Contugas\01. Reporte resumen de lecturas\Reporte de resumen de lecturas 202601.xlsx',
]

try:
    dfs_l, dfs_f = [], []
    for archivo in archivos:
        df_l, df_f = cargar_excel(archivo)
        dfs_l.append(df_l)
        dfs_f.append(df_f)
    
    df_l = pd.concat(dfs_l, ignore_index=True)
    df_f = pd.concat(dfs_f, ignore_index=True)
    df_l, df_f = limpiar_datos(df_l, df_f)
    c2, c3, c4, c5 = ejecutar_recategorizacion(df_l, df_f)

    print(f"Cuadro 2 (procesados): {len(c2):,}")
    print(f"Recategorizados:       {(c2['Estado']=='Recategorizado').sum():,}")
    print(f"Sin cambios:           {(c2['Estado']=='Sin cambio').sum():,}")
    print(f"Cuadro 4 (no aptos):   {len(c4):,}")
    print(f"Cuadro 5 (anomalías):  {len(c5):,}")

except Exception as e:
    traceback.print_exc()