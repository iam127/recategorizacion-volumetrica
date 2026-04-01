import pandas as pd
import numpy as np
from datetime import date
from dateutil.relativedelta import relativedelta

# =====================
# CONFIGURACIÓN GENERAL
# =====================
TARIFAS_VIGENTES  = ["REG-A1-CO", "REG-A2-CO", "REG-B-CO"]
NUM_MESES         = 6
DIAS_ESTANDAR_MES = 30.41
UMBRALES_TARIFAS  = {"A1_max": 30, "A2_max": 300}

CODIGOS_EVENTOS = {
    "periodica"  : 1,
    "corte"      : 13,
    "reconexion" : 18,
    "desmontaje" : 22,
    "montaje"    : 21,
}
LECTURAS_VALIDAS = list(CODIGOS_EVENTOS.values())


# ══════════════════════════════════════════════════════════════
#  CARGA DE ARCHIVOS
# ══════════════════════════════════════════════════════════════

def cargar_excel(archivo_lectura):
    """Carga archivos de lecturas (carpeta 01)."""
    df_lectura = pd.read_excel(archivo_lectura, header=5)

    campos_lectura = [
        "Cuenta contrato", "Instalación", "Fecha de lectura",
        "Fecha de lectura anterior", "Lectura", "Lectura Anterior",
        "Presión de Medida", "Factor de Corrección",
        "Tipo de tarifa", "Clase de lectura", "Motivo de lectura",
        "Descripción ML.1", "Porción", "Unidad Predial",
    ]
    campos_ok = [c for c in campos_lectura if c in df_lectura.columns]
    df_lectura_clean = df_lectura[campos_ok].copy()

    col_consumo = "Consumo facturado." if "Consumo facturado." in df_lectura.columns else None
    df_facturacion_clean = df_lectura[[
        "Cuenta contrato", "Tipo de tarifa", "Fecha de lectura",
        *(["Consumo facturado."] if col_consumo else [])
    ]].copy()
    df_facturacion_clean = df_facturacion_clean.rename(columns={
        "Cuenta contrato":    "Cuenta Contrato",
        "Tipo de tarifa":     "Tipo de tarifa de facturación",
        "Fecha de lectura":   "Fecha de contabilización",
        "Consumo facturado.": "Volumen Facturado",
    })
    df_facturacion_clean["Clase de Lectura"] = 1
    if "Porción" in df_lectura.columns:
        df_facturacion_clean["Porción"] = df_lectura["Porción"].values

    return df_lectura_clean, df_facturacion_clean


def cargar_excel_facturacion(archivo_facturacion):
    """Carga archivos de facturación externos (carpeta 03)."""
    df = pd.read_excel(archivo_facturacion)
    campos = [
        "Cuenta Contrato", "Volumen Facturado",
        "Tipo de tarifa de facturación",
        "Fecha de contabilización", "Clase de Lectura", "Porción",
    ]
    campos_ok = [c for c in campos if c in df.columns]
    return df[campos_ok].copy()


# ══════════════════════════════════════════════════════════════
#  LIMPIEZA
# ══════════════════════════════════════════════════════════════

def limpiar_datos(df_lectura_clean, df_facturacion_clean):
    df_lectura_clean["Fecha de lectura"] = pd.to_datetime(
        df_lectura_clean["Fecha de lectura"], errors="coerce"
    ).dt.normalize()
    df_lectura_clean["Fecha de lectura anterior"] = pd.to_datetime(
        df_lectura_clean["Fecha de lectura anterior"], errors="coerce"
    ).dt.normalize()

    df_lectura_clean["Instalación"] = (
        df_lectura_clean["Instalación"]
        .astype(float).astype(int).astype(str).str.strip()
    )
    df_lectura_clean["Cuenta contrato"] = (
        df_lectura_clean["Cuenta contrato"]
        .astype(float).astype(int).astype(str).str.strip()
    )
    df_lectura_clean["Motivo de lectura"] = pd.to_numeric(
        df_lectura_clean["Motivo de lectura"], errors="coerce"
    )
    for col in ["Lectura", "Lectura Anterior", "Factor de Corrección"]:
        if col in df_lectura_clean.columns:
            df_lectura_clean[col] = pd.to_numeric(df_lectura_clean[col], errors="coerce")

    df_facturacion_clean["Cuenta Contrato"] = (
        df_facturacion_clean["Cuenta Contrato"]
        .astype(float).astype(int).astype(str).str.strip()
    )
    df_facturacion_clean = df_facturacion_clean.rename(
        columns={"Cuenta Contrato": "Cuenta contrato"}
    )
    df_facturacion_clean["Fecha de contabilización"] = pd.to_datetime(
        df_facturacion_clean["Fecha de contabilización"], errors="coerce"
    ).dt.normalize()

    df_lectura_clean = (
        df_lectura_clean
        .sort_values(["Instalación", "Fecha de lectura"])
        .reset_index(drop=True)
    )
    df_lectura_clean["fecha_anterior_calculada"] = (
        df_lectura_clean.groupby("Instalación")["Fecha de lectura"].shift(1)
    )
    df_lectura_clean["Fecha de lectura anterior"] = (
        df_lectura_clean["Fecha de lectura anterior"]
        .fillna(df_lectura_clean["fecha_anterior_calculada"])
    )
    mask = (
        df_lectura_clean["Fecha de lectura anterior"] >
        df_lectura_clean["Fecha de lectura"]
    )
    df_lectura_clean.loc[mask, "Fecha de lectura anterior"] = pd.NaT
    df_lectura_clean = df_lectura_clean.drop(columns=["fecha_anterior_calculada"])

    return df_lectura_clean, df_facturacion_clean


def limpiar_facturacion_externa(df_facturacion):
    """Limpia archivos de facturación externos (carpeta 03)."""
    df = df_facturacion.copy()
    if "Cuenta Contrato" in df.columns:
        df = df.rename(columns={"Cuenta Contrato": "Cuenta contrato"})
    df["Cuenta contrato"] = (
        df["Cuenta contrato"]
        .astype(float).astype(int).astype(str).str.strip()
    )
    df["Fecha de contabilización"] = pd.to_datetime(
        df["Fecha de contabilización"], errors="coerce"
    ).dt.normalize()
    return df


# ══════════════════════════════════════════════════════════════
#  FUNCIONES AUXILIARES
# ══════════════════════════════════════════════════════════════

def _redondear(valor):
    """Regla: <= 0.5 baja, >= 0.6 sube."""
    if pd.isna(valor):
        return 0
    p = int(valor)
    d = valor - p
    if d <= 0.5:
        return p
    if d >= 0.6:
        return p + 1
    return p


def _asignar_tarifa(promedio):
    if promedio <= UMBRALES_TARIFAS["A1_max"]:
        return "REG-A1-CO"
    if promedio <= UMBRALES_TARIFAS["A2_max"]:
        return "REG-A2-CO"
    return "REG-B-CO"


def _obtener_rango(valor):
    """Rangos detallados de consumo — igual que obtener_rango_consumo del notebook de Jesús v7."""
    if pd.isna(valor):
        return "Sin data"
    p = int(valor)
    rangos = [
        (15,   "[0m3 - 15m3]"),
        (30,   "[16m3 - 30m3]"),
        (50,   "[31m3 - 50m3]"),
        (100,  "[51m3 - 100m3]"),
        (150,  "[101m3 - 150m3]"),
        (200,  "[151m3 - 200m3]"),
        (250,  "[201m3 - 250m3]"),
        (300,  "[251m3 - 300m3]"),
        (500,  "[301m3 - 500m3]"),
        (1000, "[501m3 - 1000m3]"),
        (1500, "[1001m3 - 1500m3]"),
        (2000, "[1501m3 - 2000m3]"),
        (2500, "[2001m3 - 2500m3]"),
        (3000, "[2501m3 - 3000m3]"),
        (3500, "[3001m3 - 3500m3]"),
        (4000, "[3501m3 - 4000m3]"),
        (4500, "[4001m3 - 4500m3]"),
        (5000, "[4501m3 - 5000m3]"),
    ]
    for lim, etiq in rangos:
        if p <= lim:
            return etiq
    return "> 5000"


def _safe_date(val):
    """Convierte un valor a date de Python o None."""
    try:
        if val is None:
            return None
        # Detectar NaT de pandas
        if pd.isna(val):
            return None
        if hasattr(val, 'date'):
            return val.date()
        return pd.Timestamp(val).date()
    except Exception:
        return None


def _safe_float(val):
    """Convierte un valor a float o None."""
    try:
        v = float(val)
        return None if np.isnan(v) else v
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════
#  MOTOR DE CÁLCULO — calcular_consumo_maestro (Jesús v7)
# ══════════════════════════════════════════════════════════════

def calcular_consumo_maestro(grupo):
    """
    Motor de cálculo de consumo por pares de lecturas periódicas consecutivas.
    Equivalente exacto al Código 2 del notebook de Jesús v7.
    """
    grupo = grupo.sort_values("Fecha de lectura").reset_index(drop=True)
    resultados = []

    periodicas = grupo[grupo["Motivo de lectura"] == CODIGOS_EVENTOS["periodica"]].copy()

    if len(periodicas) < 2:
        return pd.DataFrame(resultados)

    for i in range(1, len(periodicas)):
        row_fin = periodicas.iloc[i]
        row_ini = periodicas.iloc[i - 1]

        fecha_ini    = row_ini["Fecha de lectura"]
        fecha_fin    = row_fin["Fecha de lectura"]
        lec_ini      = row_ini["Lectura"]
        lec_fin      = row_fin["Lectura"]
        dias_totales = (fecha_fin - fecha_ini).days

        mask    = (
            (grupo["Fecha de lectura"] > fecha_ini) &
            (grupo["Fecha de lectura"] < fecha_fin)
        )
        eventos = grupo[mask].copy()

        volumen   = 0.0
        escenario = "1. Periódica Normal"

        tiene_corte = CODIGOS_EVENTOS["corte"]      in eventos["Motivo de lectura"].values
        tiene_recon = CODIGOS_EVENTOS["reconexion"] in eventos["Motivo de lectura"].values
        tiene_des   = CODIGOS_EVENTOS["desmontaje"] in eventos["Motivo de lectura"].values
        tiene_mon   = CODIGOS_EVENTOS["montaje"]    in eventos["Motivo de lectura"].values

        if tiene_des and tiene_mon:
            ev_cambio = eventos[
                eventos["Motivo de lectura"].isin([22, 21])
            ].sort_values("Fecha de lectura")
            tramos, base = [], lec_ini

            for _, ev in ev_cambio.iterrows():
                if ev["Motivo de lectura"] == 22:
                    tramos.append(max(0, ev["Lectura"] - base))
                    base = None
                elif ev["Motivo de lectura"] == 21 and base is None:
                    base = ev["Lectura"]

            if base is not None:
                tramos.append(max(0, lec_fin - base))
            else:
                tramos.append(max(0, lec_fin - lec_ini))

            volumen   = sum(tramos)
            escenario = f"7. Multi-Ciclo ({len(tramos)} tramos)"

        elif tiene_corte and tiene_recon:
            lec_c     = eventos[eventos["Motivo de lectura"] == 13]["Lectura"].iloc[-1]
            lec_r     = eventos[eventos["Motivo de lectura"] == 18]["Lectura"].iloc[0]
            volumen   = max(0, lec_c - lec_ini) + max(0, lec_fin - lec_r)
            escenario = "4. Corte + Reconexión"

        elif tiene_corte and not tiene_recon:
            lec_c     = eventos[eventos["Motivo de lectura"] == 13]["Lectura"].iloc[-1]
            volumen   = max(0, lec_c - lec_ini) + max(0, lec_fin - lec_c)
            escenario = "2. Solo Corte"

        elif tiene_recon and not tiene_corte:
            lec_r     = eventos[eventos["Motivo de lectura"] == 18]["Lectura"].iloc[0]
            volumen   = max(0, lec_r - lec_ini) + max(0, lec_fin - lec_r)
            escenario = "3. Solo Reconexión"

        else:
            volumen = max(0, lec_fin - lec_ini)

        factor = row_fin["Factor de Corrección"] if pd.notna(row_fin["Factor de Corrección"]) else 1.0

        resultados.append({
            "Cuenta contrato"             : row_fin["Cuenta contrato"],
            "Instalación"                 : row_fin["Instalación"],
            "Fecha periódica"             : fecha_fin,
            "Lectura Anterior"            : lec_ini,
            "Lectura Actual"              : lec_fin,
            "Periodo"                     : row_fin["Fecha de lectura"].to_period("M"),
            "Días de consumo calculado"   : dias_totales,
            "Consumo m3 calculado"        : volumen,
            "Factor de Corrección"        : factor,
            "Consumo facturado calculado" : volumen * factor,
            "Escenario"                   : escenario,
            "Tipo de tarifa"              : row_fin["Tipo de tarifa"],
            "Clase de lectura"            : row_fin["Clase de lectura"],
            "Motivo de lectura"           : row_fin["Motivo de lectura"],
            "Porción"                     : row_fin.get("Porción"),
            "Unidad Predial"              : row_fin.get("Unidad Predial"),
        })

    return pd.DataFrame(resultados)


# ══════════════════════════════════════════════════════════════
#  ETL PRINCIPAL
# ══════════════════════════════════════════════════════════════

def ejecutar_recategorizacion(df_lectura_clean, df_facturacion_clean, df_facturacion_externa=None):
    """
    Ejecuta el proceso completo de recategorización volumétrica.
    Usa el motor calcular_consumo_maestro del notebook de Jesús (v7).

    Retorna: cuadro_2, cuadro_3, cuadro_4, cuadro_5, df_mensual_final, cuadro_matriz
    """

    # ── PASO 1: Referencias históricas ───────────────────────────────────────
    df = df_lectura_clean.sort_values(
        ["Instalación", "Fecha de lectura"]
    ).reset_index(drop=True)

    for col, base in [
        ("Lectura_Registro_Anterior",          "Lectura"),
        ("Motivo_Registro_Anterior",           "Motivo de lectura"),
        ("Lectura_Anterior_Registro_Anterior", "Lectura Anterior"),
        ("Fecha_Lectura_Anterior_Historica",   "Fecha de lectura"),
    ]:
        df[col] = df.groupby("Instalación")[base].shift(1)

    print("✅ Referencias históricas generadas")

    # ── PASO 1.5: Periodos ────────────────────────────────────────────────────
    df["Periodo"] = df["Fecha de lectura"].dt.to_period("M")

    if df_facturacion_externa is not None:
        df_fact = df_facturacion_externa.copy()
        print("   📊 Usando archivos de facturación externos")
    else:
        df_fact = df_facturacion_clean.copy()
        print("   📊 Usando tarifa derivada de archivos de lectura (fallback)")

    df_fact["Periodo_Fact"] = df_fact["Fecha de contabilización"].dt.to_period("M")

    # ── PASO 1.6: Tarifa por mes desde facturación ───────────────────────────
    df_tarifa_ref = (
        df_fact
        .sort_values(["Cuenta contrato", "Fecha de contabilización"])
        .groupby(["Cuenta contrato", "Periodo_Fact"])["Tipo de tarifa de facturación"]
        .last()
        .reset_index()
        .rename(columns={
            "Tipo de tarifa de facturación": "Tarifa_Fact",
            "Periodo_Fact"                 : "Periodo",
        })
    )

    df = df.merge(df_tarifa_ref, on=["Cuenta contrato", "Periodo"], how="left")
    df["Tipo de tarifa"]    = df["Tarifa_Fact"].fillna(df["Tipo de tarifa"])
    df = df.drop(columns=["Tarifa_Fact"], errors="ignore")
    df["Tarifa referencia"] = df["Tipo de tarifa"]

    print(f"   • Tarifas asignadas: {df['Tarifa referencia'].notna().sum():,}")

    # ── PASO 1.7: Estado inicial ──────────────────────────────────────────────
    df["Estado inicial"] = np.select(
        [
            df["Tarifa referencia"].isna(),
            ~df["Tarifa referencia"].isin(TARIFAS_VIGENTES),
        ],
        ["Cliente nuevo", "Tarifa no aplicable"],
        default="Válido"
    )
    print("✅ Estado inicial validado")

    # ── PASO 2: Cálculos base ─────────────────────────────────────────────────
    df["Consumo m3 calculado"]        = (df["Lectura"] - df["Lectura Anterior"]).clip(lower=0)
    df["Días de consumo calculado"]   = (
        df["Fecha de lectura"] - df["Fecha de lectura anterior"]
    ).dt.days
    df["Consumo facturado calculado"] = df["Consumo m3 calculado"] * df["Factor de Corrección"]

    df_todos = df.copy()
    print(f"   • Total registros (snapshot): {len(df_todos):,}")

    # ── PASO 3: Ventana de 6 meses ────────────────────────────────────────────
    fecha_max        = df["Fecha de lectura"].max()
    fecha_inicio     = fecha_max - relativedelta(months=5)
    periodos_validos = pd.period_range(
        start=fecha_inicio.to_period("M"),
        end=fecha_max.to_period("M"),
        freq="M"
    )
    print(f"✅ Ventana: {periodos_validos[0]} → {periodos_validos[-1]}")

    df_para_calculos = df[df["Periodo"].isin(periodos_validos)].copy()

    # ── PASO 3.5: Excluir instalaciones con clase de lectura 3 ───────────────
    instalaciones_clase3 = set(
        df_para_calculos[df_para_calculos["Clase de lectura"] == 3]["Instalación"].unique()
    )

    df_clase3 = pd.DataFrame()
    if instalaciones_clase3:
        df_clase3 = (
            df_para_calculos[df_para_calculos["Instalación"].isin(instalaciones_clase3)]
            .groupby("Instalación").first().reset_index()
        )
        df_clase3["Observación"]      = "Cliente presenta cálculo estimado (clase de lectura 3)"
        df_clase3["Estado inicial"]   = "No apto"
        df_clase3["meses_en_ventana"] = df_clase3["Instalación"].map(
            df_para_calculos.groupby("Instalación")["Periodo"].nunique()
        )

    df_para_calculos = df_para_calculos[
        ~df_para_calculos["Instalación"].isin(instalaciones_clase3)
    ].copy()

    print(f"   • Instalaciones clase 3 excluidas: {len(instalaciones_clase3):,}")

    # ── PASO 4: Validar clientes aptos ───────────────────────────────────────
    conteo_periodos = (
        df_para_calculos.groupby("Instalación")["Periodo"]
        .nunique().reset_index(name="meses_en_ventana")
    )
    df_para_calculos = df_para_calculos.merge(conteo_periodos, on="Instalación", how="left")
    df_para_calculos["Apto"] = (
        (df_para_calculos["meses_en_ventana"] >= NUM_MESES) &
        (df_para_calculos["Tarifa referencia"].isin(TARIFAS_VIGENTES))
    )

    df_validos       = df_para_calculos[df_para_calculos["Apto"]].copy()
    df_no_aptos_base = df_para_calculos[~df_para_calculos["Apto"]].copy()

    print(f"✅ Aptos    : {df_validos['Instalación'].nunique():,}")
    print(f"⚠️  No aptos : {df_no_aptos_base['Instalación'].nunique():,}")

    # ── PASO 4.1: Validación de histórico ────────────────────────────────────
    primer_mes = (
        df_validos.sort_values(["Instalación", "Periodo"])
        .groupby("Instalación").first()
        .reset_index()[["Instalación", "Motivo de lectura"]]
    )
    primer_mes["requiere_historico"] = primer_mes["Motivo de lectura"].isin([13, 18, 21, 22])

    df_validos = df_validos.merge(
        primer_mes[["Instalación", "requiere_historico"]], on="Instalación", how="left"
    )
    df_validos["historico_valido"] = (
        ~df_validos["requiere_historico"] |
        (
            df_validos["Lectura_Registro_Anterior"].notna() &
            df_validos["Motivo_Registro_Anterior"].isin(LECTURAS_VALIDAS)
        )
    )
    df_validos = df_validos[
        ~(df_validos["requiere_historico"] & ~df_validos["historico_valido"])
    ].copy()
    print("✅ Validación de histórico completada")

    # ── PASO 4.2: Tarifa del Mes 5 ───────────────────────────────────────────
    periodo_mes5 = periodos_validos[-2]
    tarifas_m5   = (
        df_validos[df_validos["Periodo"] == periodo_mes5]
        .groupby("Instalación")["Tarifa referencia"]
        .first()
        .to_dict()
    )
    periodo_ultimo_str = str(periodos_validos[-1])
    print(f"   • Tarifas Mes 5 guardadas: {len(tarifas_m5):,}")

    # ── PASO 5: Motor de cálculo ──────────────────────────────────────────────
    print("\n📂 Ejecutando motor de cálculo (Jesús v7)...")

    instalaciones_aptas = set(df_validos["Instalación"].unique())
    df_motor = df[df["Instalación"].isin(instalaciones_aptas)].copy()

    resultados_lista = []
    for instalacion, grupo in df_motor.groupby("Instalación", sort=False):
        res = calcular_consumo_maestro(grupo)
        if not res.empty:
            resultados_lista.append(res)

    df_resultados = (
        pd.concat(resultados_lista, ignore_index=True)
        if resultados_lista else pd.DataFrame()
    )

    # ── Guard ──
    if df_resultados.empty or "Periodo" not in df_resultados.columns:
        raise ValueError(
            f"Archivos insuficientes: se necesitan al menos 6 meses de lecturas "
            f"para ejecutar la recategorización. Solo se detectaron datos para "
            f"{df_para_calculos['Periodo'].nunique()} período(s). "
            f"Por favor carga los 7 archivos mensuales."
        )

    # Filtrar a ventana válida
    df_resultados = df_resultados[
        df_resultados["Periodo"].isin(periodos_validos)
    ].copy()

    # numero_mes_ventana
    lista_periodos = list(periodos_validos)
    df_resultados["numero_mes_ventana"] = df_resultados["Periodo"].apply(
        lambda x: lista_periodos.index(x) + 1 if x in lista_periodos else None
    )

    # Regla Mes 6 = tarifa del Mes 5
    df_resultados = df_resultados.sort_values(["Instalación", "Periodo"])

    def _aplicar_regla_m6(row):
        if str(row["Periodo"]) == periodo_ultimo_str:
            return tarifas_m5.get(row["Instalación"], row["Tipo de tarifa"])
        return row["Tipo de tarifa"]

    df_resultados["Tipo de tarifa"]    = df_resultados.apply(_aplicar_regla_m6, axis=1)
    df_resultados["Tarifa referencia"] = df_resultados["Tipo de tarifa"]

    print(f"✅ Motor completado: {len(df_resultados):,} intervalos calculados")

    # ── PASO 5.5: Agregación mensual ─────────────────────────────────────────
    df_mensual_raw = (
        df_resultados
        .groupby(["Instalación", "Periodo"], as_index=False)
        .agg(
            Cuenta_contrato   =("Cuenta contrato",             "first"),
            Factor_Correccion =("Factor de Corrección",        "mean"),
            Dias_mes          =("Días de consumo calculado",   "sum"),
            Consumo_mes       =("Consumo facturado calculado", "sum"),
            Tarifa_referencia =("Tarifa referencia",           "first"),
            Porcion           =("Porción",                     "first"),
            Unidad_Predial    =("Unidad Predial",              "first"),
            numero_mes_ventana=("numero_mes_ventana",          "first"),
        )
    )
    df_mensual_raw["Dias_mes"]    = (
        pd.to_numeric(df_mensual_raw["Dias_mes"], errors="coerce").fillna(0).clip(lower=0)
    )
    df_mensual_raw["Consumo_mes"] = df_mensual_raw["Consumo_mes"].clip(lower=0)

    df_mensual = df_mensual_raw.copy()
    df_mensual["Período"] = df_mensual["Periodo"].astype(str)
    df_mensual = df_mensual.rename(columns={"Período": "Periodo"})

    print("✅ Agregación mensual completada")

    # ══════════════════════════════════════════════════════════
    #  CUADRO 2 — Resultado por instalación
    #  Equivale al Cuadro 4 del notebook de Jesús
    # ══════════════════════════════════════════════════════════
    cuadro_2_base = (
        df_mensual_raw.groupby("Instalación")
        .agg(
            Cuenta_contrato         =("Cuenta_contrato",   "first"),
            Total_dias_consumo      =("Dias_mes",          "sum"),
            Total_consumo_facturado =("Consumo_mes",       "sum"),
            Porcion                 =("Porcion",           "first"),
            Unidad_Predial          =("Unidad_Predial",    "first"),
        ).reset_index()
    )

    cuadro_2_base["Tarifa_referencia"]           = cuadro_2_base["Instalación"].map(tarifas_m5)
    cuadro_2_base["Promedio_diario"]             = (
        cuadro_2_base["Total_consumo_facturado"] /
        cuadro_2_base["Total_dias_consumo"].replace(0, np.nan)
    ).fillna(0)
    cuadro_2_base["Promedio_mensual"]            = cuadro_2_base["Promedio_diario"] * DIAS_ESTANDAR_MES
    cuadro_2_base["Promedio_mensual_redondeado"] = cuadro_2_base["Promedio_mensual"].apply(_redondear)
    cuadro_2_base["Nueva_tarifa"]                = cuadro_2_base["Promedio_mensual_redondeado"].apply(_asignar_tarifa)
    cuadro_2_base["Estado"] = np.where(
        cuadro_2_base["Nueva_tarifa"] == cuadro_2_base["Tarifa_referencia"],
        "Sin cambio", "Recategorizado"
    )
    cuadro_2_base["Rango_consumo"] = cuadro_2_base["Promedio_mensual_redondeado"].apply(_obtener_rango)

    cuadro_2 = cuadro_2_base[[
        "Instalación", "Cuenta_contrato", "Total_dias_consumo",
        "Total_consumo_facturado", "Promedio_diario", "Promedio_mensual",
        "Promedio_mensual_redondeado", "Tarifa_referencia", "Nueva_tarifa",
        "Estado", "Porcion", "Unidad_Predial", "Rango_consumo",
    ]]

    print(f"   • Cuadro 2: {len(cuadro_2):,} clientes aptos")
    print(f"     - Recategorizados : {(cuadro_2['Estado'] == 'Recategorizado').sum():,}")
    print(f"     - Sin cambio      : {(cuadro_2['Estado'] == 'Sin cambio').sum():,}")

    # ══════════════════════════════════════════════════════════
    #  CUADRO 3 — Resumen tarifario
    #  Equivale al Cuadro 5 del notebook de Jesús
    # ══════════════════════════════════════════════════════════
    cuadro_3 = (
        cuadro_2.groupby(["Tarifa_referencia", "Nueva_tarifa"])
        .size().reset_index()
        .rename(columns={
            0                  : "Cantidad_clientes",
            "Tarifa_referencia" : "Tarifa_referencia",
            "Nueva_tarifa"      : "Nueva_tarifa",
        })
    )
    total_c3 = cuadro_3["Cantidad_clientes"].sum()
    cuadro_3["Porcentaje"] = (
        cuadro_3["Cantidad_clientes"] / total_c3 * 100 if total_c3 > 0 else 0
    )

    # ══════════════════════════════════════════════════════════
    #  CUADRO 4 — Clientes no aptos
    #  Equivale al Cuadro 6 del notebook de Jesús
    # ══════════════════════════════════════════════════════════
    def _observacion(row):
        if pd.notna(row.get("Observación")) and str(row.get("Observación", "")).strip() != "":
            return row["Observación"]
        obs = []
        if row.get("Tarifa referencia") not in TARIFAS_VIGENTES:
            obs.append("Tarifa no vigente")
        meses = row.get("meses_en_ventana", 0)
        if pd.notna(meses) and int(meses) < NUM_MESES:
            obs.append(f"Menos de 6 meses ({int(meses)})")
        return "; ".join(obs) if obs else "No cumple criterios"

    if not df_no_aptos_base.empty:
        no_aptos_uniq = df_no_aptos_base.groupby("Instalación").first().reset_index()
        no_aptos_uniq["Observación"]    = no_aptos_uniq.apply(_observacion, axis=1)
        no_aptos_uniq["Estado inicial"] = "No apto"
        cuadro_4 = no_aptos_uniq[[
            "Cuenta contrato", "Instalación", "Tarifa referencia",
            "Observación", "Porción", "Unidad Predial",
            "meses_en_ventana", "Estado inicial",
        ]].copy()
    else:
        cuadro_4 = pd.DataFrame(columns=[
            "Cuenta contrato", "Instalación", "Tarifa referencia",
            "Observación", "Porción", "Unidad Predial",
            "meses_en_ventana", "Estado inicial",
        ])

    if not df_clase3.empty:
        cols_c4 = [
            "Cuenta contrato", "Instalación", "Tarifa referencia",
            "Observación", "Porción", "Unidad Predial",
            "meses_en_ventana", "Estado inicial",
        ]
        df_clase3_c4 = df_clase3[[c for c in cols_c4 if c in df_clase3.columns]].copy()
        cuadro_4 = pd.concat([cuadro_4, df_clase3_c4], ignore_index=True)
        print(f"   • {len(df_clase3_c4):,} instalaciones clase 3 agregadas al Cuadro 4")

    instalaciones_en_ventana    = set(df_para_calculos["Instalación"].astype(str).str.strip().unique())
    instalaciones_totales       = set(df_todos["Instalación"].astype(str).str.strip().unique())
    instalaciones_fuera_ventana = instalaciones_totales - instalaciones_en_ventana

    if instalaciones_fuera_ventana:
        df_fv = (
            df_todos[df_todos["Instalación"].astype(str).str.strip().isin(instalaciones_fuera_ventana)]
            [["Cuenta contrato", "Instalación", "Tarifa referencia", "Porción", "Unidad Predial"]]
            .drop_duplicates()
        )
        df_fv["meses_en_ventana"] = 0
        df_fv["Estado inicial"]   = "No apto"
        df_fv["Observación"]      = "Sin lecturas en ventana de evaluación (6 meses)"
        cuadro_4 = pd.concat([cuadro_4, df_fv], ignore_index=True)

    cuadro_4 = cuadro_4.drop_duplicates(subset=["Instalación"])
    print(f"   • Cuadro 4: {len(cuadro_4):,} clientes no aptos")

    # ══════════════════════════════════════════════════════════
    #  CUADRO 5 — Anomalías
    #  Equivale al Cuadro 7 del notebook de Jesús
    # ══════════════════════════════════════════════════════════
    df_an = df_todos.sort_values(["Instalación", "Fecha de lectura"]).copy()

    for src, dst in [
        ("Lectura Anterior",          "_LecAnterior_sig"),
        ("Fecha de lectura anterior", "_FechaAnt_sig"),
        ("Motivo de lectura",         "_Motivo_sig"),
        ("Lectura",                   "_Lec_sig"),
    ]:
        df_an[dst] = df_an.groupby("Instalación")[src].shift(-1)

    consumo_sig = df_an["_Lec_sig"] - df_an["_LecAnterior_sig"]

    masks_anomalias = {
        "Ruptura diagonal en Lectura"         : (
            df_an["Lectura"].notna() & df_an["_LecAnterior_sig"].notna() &
            ((df_an["Lectura"] - df_an["_LecAnterior_sig"]).abs() > 0.01)
        ),
        "Ruptura diagonal en Fecha"           : (
            df_an["Fecha de lectura"].notna() & df_an["_FechaAnt_sig"].notna() &
            (df_an["Fecha de lectura"] != df_an["_FechaAnt_sig"])
        ),
        "Consumo post-Corte sin Reconexión"   : (
            (df_an["Motivo de lectura"] == CODIGOS_EVENTOS["corte"]) &
            (consumo_sig > 0.01) &
            (df_an["_Motivo_sig"] != CODIGOS_EVENTOS["reconexion"])
        ),
        "Consumo post-Desmontaje sin Montaje" : (
            (df_an["Motivo de lectura"] == CODIGOS_EVENTOS["desmontaje"]) &
            (consumo_sig > 0.01) &
            (df_an["_Motivo_sig"] != CODIGOS_EVENTOS["montaje"])
        ),
    }

    partes = []
    for tipo, mask in masks_anomalias.items():
        sub = df_an[mask][["Cuenta contrato", "Instalación", "Fecha de lectura"]].copy()
        sub["desc"] = tipo
        partes.append(sub)

    if partes:
        df_an_all = pd.concat(partes, ignore_index=True)
        cuadro_5_raw = (
            df_an_all
            .groupby(["Cuenta contrato", "Instalación"])
            .agg(
                Fecha       =("Fecha de lectura", "max"),
                tipo_concat =("desc", lambda x: "; ".join(sorted(set(x))))
            )
            .reset_index()
            .rename(columns={
                "Cuenta contrato": "Cuenta_contrato",
                "Instalación"    : "Instalacion",
                "tipo_concat"    : "Tipo_anomalia",
            })
        )
    else:
        cuadro_5_raw = pd.DataFrame(columns=[
            "Cuenta_contrato", "Instalacion", "Fecha", "Tipo_anomalia"
        ])

    cuadro_5 = cuadro_5_raw
    print(f"   • Cuadro 5: {len(cuadro_5):,} clientes con anomalías")

    # ══════════════════════════════════════════════════════════
    #  CUADRO MATRIZ — Cuadro 3 completo del notebook de Jesús
    #  Una fila por instalación con detalle por mes
    # ══════════════════════════════════════════════════════════
    print("\n📂 Generando Matriz de Recategorización (Cuadro 3 completo)...")

    # Base: totales por instalación
    matriz_base = (
        df_mensual_raw.groupby("Instalación")
        .agg(
            Cuenta_contrato         =("Cuenta_contrato",   "first"),
            Total_dias_consumo      =("Dias_mes",          "sum"),
            Total_consumo_facturado =("Consumo_mes",       "sum"),
            Porcon                  =("Porcion",           "first"),
        ).reset_index()
    )

    matriz_base["Tarifa_referencia"]   = matriz_base["Instalación"].map(tarifas_m5)
    matriz_base["Promedio_diario"]     = (
        matriz_base["Total_consumo_facturado"] /
        matriz_base["Total_dias_consumo"].replace(0, np.nan)
    ).fillna(0)
    matriz_base["Promedio_mensual"]    = matriz_base["Promedio_diario"] * DIAS_ESTANDAR_MES
    matriz_base["Promedio_redondeado"] = matriz_base["Promedio_mensual"].apply(_redondear)
    matriz_base["Tarifa_nueva"]        = matriz_base["Promedio_redondeado"].apply(_asignar_tarifa)
    matriz_base["Recategorizar"]       = np.where(
        matriz_base["Tarifa_nueva"] != matriz_base["Tarifa_referencia"], "Sí", "No"
    )
    matriz_base["Rango_consumo"]       = matriz_base["Promedio_redondeado"].apply(_obtener_rango)
    matriz_base["Comportamiento"]      = "Consumo variable"

    # Pivot por mes
    df_piv = df_resultados.copy()
    df_piv["Num_Mes"] = df_piv["Periodo"].apply(
        lambda x: lista_periodos.index(x) + 1 if x in lista_periodos else None
    )
    df_piv = df_piv[df_piv["Num_Mes"].notna()].copy()
    df_piv["Num_Mes"] = df_piv["Num_Mes"].astype(int)

    df_por_mes = (
        df_piv.groupby(["Instalación", "Num_Mes"], as_index=False)
        .agg(
            CF=("Consumo facturado calculado", "sum"),
            FL=("Fecha periódica",             "max"),
            DC=("Días de consumo calculado",   "sum"),
            CL=("Clase de lectura",            "last"),
            TF=("Tarifa referencia",           "last"),
        )
    )

    def _hacer_pivot(campo, prefijo):
        p = df_por_mes.pivot(index="Instalación", columns="Num_Mes", values=campo)
        p.columns = [f"{prefijo}_{int(c)}" for c in p.columns]
        return p

    df_detalles = pd.concat([
        _hacer_pivot("CF", "CF_mes"),
        _hacer_pivot("FL", "FL_mes"),
        _hacer_pivot("DC", "DC_mes"),
        _hacer_pivot("CL", "CL_mes"),
        _hacer_pivot("TF", "Tarifa_mes"),
    ], axis=1).reset_index()

    # Asegurar columnas para los 6 meses
    for mes in range(1, 7):
        for pref in ["CF_mes", "FL_mes", "DC_mes", "CL_mes", "Tarifa_mes"]:
            col = f"{pref}_{mes}"
            if col not in df_detalles.columns:
                df_detalles[col] = None

    # Mes histórico = Mes 6
    df_detalles["CF_mes_historico"] = df_detalles["CF_mes_6"]
    df_detalles["FL_mes_historico"] = df_detalles["FL_mes_6"]
    df_detalles["CL_mes_historico"] = df_detalles["CL_mes_6"]

    # Lecturas del mes 6 (último período)
    df_lec_mes6 = df_resultados[
        df_resultados["Periodo"].astype(str) == periodo_ultimo_str
    ].sort_values(["Instalación", "Fecha periódica"])

    if not df_lec_mes6.empty and "Lectura Actual" in df_lec_mes6.columns:
        lec_mes6 = (
            df_lec_mes6
            .groupby("Instalación")
            .agg({
                "Lectura Anterior"    : "first",
                "Lectura Actual"      : "last",
                "Factor de Corrección": "last",
            })
            .reset_index()
        )
        df_detalles = df_detalles.merge(lec_mes6, on="Instalación", how="left")
    else:
        df_detalles["Lectura Anterior"]     = None
        df_detalles["Lectura Actual"]       = None
        df_detalles["Factor de Corrección"] = None

    cuadro_matriz = matriz_base.merge(df_detalles, on="Instalación", how="left")
    print(f"   • Matriz: {len(cuadro_matriz):,} instalaciones")

    # ══════════════════════════════════════════════════════════
    #  df_mensual final
    # ══════════════════════════════════════════════════════════
    df_mensual_final = df_mensual_raw.copy()
    df_mensual_final["Periodo"] = df_mensual_final["Periodo"].astype(str)
    df_mensual_final = df_mensual_final.rename(columns={
        "Instalación": "Instalación",
    })

    print(f"\n✅ PROCESO FINALIZADO")
    print(f"   Período evaluado : {periodos_validos[0]} → {periodos_validos[-1]}")
    print(f"   Mes 5 (actual)   : {periodos_validos[-2]}")
    print(f"   Mes 6 (nuevo)    : {periodos_validos[-1]}")

    return cuadro_2, cuadro_3, cuadro_4, cuadro_5, df_mensual_final, cuadro_matriz