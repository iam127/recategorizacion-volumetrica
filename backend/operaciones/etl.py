import pandas as pd
import numpy as np

# =====================
# CONFIGURACIÓN GENERAL
# =====================
TARIFAS_VIGENTES = ["REG-A1-CO", "REG-A2-CO", "REG-B-CO"]
NUM_MESES = 6
DIAS_ESTANDAR_MES = 30.41
UMBRALES_TARIFAS = {"A1_max": 30, "A2_max": 300}
CODIGOS_EVENTOS = {
    "periodica": 1,
    "corte": 13,
    "reconexion": 18,
    "desmontaje": 22,
    "montaje": 21
}
LECTURAS_VALIDAS = list(CODIGOS_EVENTOS.values())


def cargar_excel(archivo_lectura):
    df_lectura = pd.read_excel(archivo_lectura, header=5)
    campos_lectura = [
        "Cuenta contrato", "Instalación", "Fecha de lectura",
        "Fecha de lectura anterior", "Lectura", "Lectura Anterior",
        "Días de consumo", "Consumo m3", "Presión de Medida",
        "Factor de Corrección", "Consumo facturado.", "Tipo de tarifa",
        "Clase de lectura", "Motivo de lectura", "Descripción ML.1",
        "Porción", "Unidad Predial"
    ]
    df_lectura_clean = df_lectura[campos_lectura].copy()

    # Facturación derivada del archivo de lecturas (fallback)
    df_facturacion_clean = df_lectura[[
        "Cuenta contrato", "Tipo de tarifa", "Fecha de lectura", "Consumo facturado."
    ]].copy()
    df_facturacion_clean = df_facturacion_clean.rename(columns={
        "Cuenta contrato":    "Cuenta Contrato",
        "Tipo de tarifa":     "Tipo de tarifa de facturación",
        "Fecha de lectura":   "Fecha de contabilización",
        "Consumo facturado.": "Volumen Facturado",
    })
    df_facturacion_clean["Clase de Lectura"] = 1
    df_facturacion_clean["Porción"] = df_lectura["Porción"]

    return df_lectura_clean, df_facturacion_clean


def cargar_excel_facturacion(archivo_facturacion):
    """Carga archivos de la carpeta 03. Reportes resumen de facturación"""
    df = pd.read_excel(archivo_facturacion)
    campos = ["Cuenta Contrato", "Volumen Facturado", "Tipo de tarifa de facturación",
              "Fecha de contabilización", "Clase de Lectura", "Porción"]
    # Solo tomar columnas que existan
    campos_existentes = [c for c in campos if c in df.columns]
    df_clean = df[campos_existentes].copy()
    return df_clean


def limpiar_datos(df_lectura_clean, df_facturacion_clean):
    df_lectura_clean["Fecha de lectura"] = pd.to_datetime(
        df_lectura_clean["Fecha de lectura"], errors="coerce"
    ).dt.normalize()
    df_lectura_clean["Fecha de lectura anterior"] = pd.to_datetime(
        df_lectura_clean["Fecha de lectura anterior"], errors="coerce"
    ).dt.normalize()

    df_lectura_clean["Cuenta contrato"] = (
        df_lectura_clean["Cuenta contrato"]
        .astype(float).astype(int).astype(str).str.strip()
    )
    df_lectura_clean["Motivo de lectura"] = pd.to_numeric(
        df_lectura_clean["Motivo de lectura"], errors="coerce"
    )
    for col in ["Lectura", "Lectura Anterior", "Factor de Corrección"]:
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
    """Limpia archivos de facturación externos (carpeta 03)"""
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


def _redondear(valor):
    parte_entera  = int(valor)
    parte_decimal = valor - parte_entera
    return parte_entera if parte_decimal <= 0.5 else parte_entera + 1


def _asignar_tarifa(promedio):
    if promedio <= UMBRALES_TARIFAS["A1_max"]:
        return "REG-A1-CO"
    if promedio <= UMBRALES_TARIFAS["A2_max"]:
        return "REG-A2-CO"
    return "REG-B-CO"


def _calcular_consumo_mensual(grupo):
    grupo = grupo.sort_values("Fecha de lectura")
    lectura_anterior  = grupo["Lectura Anterior"].iloc[0]
    lectura_actual    = grupo["Lectura"].iloc[-1]
    primer_registro   = grupo.iloc[0]
    numero_mes        = grupo["numero_mes_ventana"].iloc[0]

    periodica  = grupo[grupo["Motivo de lectura"] == CODIGOS_EVENTOS["periodica"]]
    corte      = grupo[grupo["Motivo de lectura"] == CODIGOS_EVENTOS["corte"]]
    reconexion = grupo[grupo["Motivo de lectura"] == CODIGOS_EVENTOS["reconexion"]]
    desmontaje = grupo[grupo["Motivo de lectura"] == CODIGOS_EVENTOS["desmontaje"]]
    montaje    = grupo[grupo["Motivo de lectura"] == CODIGOS_EVENTOS["montaje"]]

    lectura_periodica = periodica["Lectura"].iloc[-1]          if not periodica.empty else None
    fecha_periodica   = periodica["Fecha de lectura"].iloc[-1] if not periodica.empty else None
    n_desmontajes     = len(desmontaje)
    n_montajes        = len(montaje)

    if numero_mes == NUM_MESES and not periodica.empty and fecha_periodica is not None:
        eventos_despues = any([
            len(corte)      > 0 and corte["Fecha de lectura"].iloc[0]      > fecha_periodica,
            len(reconexion) > 0 and reconexion["Fecha de lectura"].iloc[0] > fecha_periodica,
            len(desmontaje) > 0 and desmontaje["Fecha de lectura"].iloc[0] > fecha_periodica,
            len(montaje)    > 0 and montaje["Fecha de lectura"].iloc[0]    > fecha_periodica,
        ])
        if eventos_despues:
            return max(lectura_periodica - lectura_anterior, 0)

    if n_desmontajes >= 2 and n_montajes >= 2 and not periodica.empty and fecha_periodica is not None:
        ultima_fecha_d = desmontaje["Fecha de lectura"].max()
        ultima_fecha_m = montaje["Fecha de lectura"].max()
        if (ultima_fecha_d < fecha_periodica) and (ultima_fecha_m < fecha_periodica):
            d_ord = desmontaje.sort_values("Fecha de lectura")
            m_ord = montaje.sort_values("Fecha de lectura")
            D1, D2 = d_ord["Lectura"].iloc[0], d_ord["Lectura"].iloc[1]
            M1, M2 = m_ord["Lectura"].iloc[0], m_ord["Lectura"].iloc[1]
            return max((D1 - lectura_anterior) + (D2 - M1) + (lectura_periodica - M2), 0)

    if n_desmontajes >= 2 and n_montajes >= 2 and not periodica.empty and fecha_periodica is not None:
        primera_d   = desmontaje["Fecha de lectura"].min()
        ultima_d    = desmontaje["Fecha de lectura"].max()
        primera_m   = montaje["Fecha de lectura"].min()
        ultima_m    = montaje["Fecha de lectura"].max()
        hay_antes   = (primera_d < fecha_periodica) or (primera_m < fecha_periodica)
        hay_despues = (ultima_d  > fecha_periodica) or (ultima_m  > fecha_periodica)
        if hay_antes and hay_despues:
            d_antes = desmontaje[desmontaje["Fecha de lectura"] <= fecha_periodica]
            m_antes = montaje[montaje["Fecha de lectura"]       <= fecha_periodica]
            if len(d_antes) > 0 and len(m_antes) > 0:
                return max(
                    (d_antes["Lectura"].iloc[0] - lectura_anterior) +
                    (lectura_periodica - m_antes["Lectura"].iloc[0]), 0
                )
            return max(lectura_periodica - lectura_anterior, 0)

    lec_corte      = corte["Lectura"].iloc[0]      if len(corte)      > 0 else None
    lec_reconexion = reconexion["Lectura"].iloc[0] if len(reconexion) > 0 else None
    lec_desmontaje = desmontaje["Lectura"].iloc[0] if n_desmontajes   > 0 else None
    lec_montaje    = montaje["Lectura"].iloc[0]    if n_montajes      > 0 else None

    if n_desmontajes > 1 or n_montajes > 1:
        return max(lectura_actual - lectura_anterior, 0)

    mot_ant = primer_registro["Motivo_Registro_Anterior"]
    if mot_ant == CODIGOS_EVENTOS["corte"] and lec_reconexion is not None:
        corte_hist = primer_registro["Lectura_Registro_Anterior"]
        base_hist  = primer_registro["Lectura_Anterior_Registro_Anterior"]
        lec_final  = lectura_periodica if lectura_periodica is not None else lectura_actual
        return max((corte_hist - base_hist) + (lec_final - lec_reconexion), 0)

    if mot_ant == CODIGOS_EVENTOS["desmontaje"] and lec_montaje is not None:
        desm_hist = primer_registro["Lectura_Registro_Anterior"]
        base_hist = primer_registro["Lectura_Anterior_Registro_Anterior"]
        lec_final = lectura_periodica if lectura_periodica is not None else lectura_actual
        return max((desm_hist - base_hist) + (lec_final - lec_montaje), 0)

    if lec_desmontaje is not None and lec_montaje is not None:
        return max((lec_desmontaje - lectura_anterior) + (lectura_actual - lec_montaje), 0)
    if lec_desmontaje is not None:
        return max(lec_desmontaje - lectura_anterior, 0)
    if lec_montaje is not None:
        return max(lectura_actual - lec_montaje, 0)
    if lec_corte is not None and lec_reconexion is not None:
        return max((lec_corte - lectura_anterior) + (lectura_actual - lec_reconexion), 0)
    if lec_corte is not None:
        return max(lec_corte - lectura_anterior, 0)
    if lec_reconexion is not None:
        return max(lectura_actual - lec_reconexion, 0)
    if lectura_periodica is not None:
        return max(lectura_periodica - lectura_anterior, 0)

    return max(lectura_actual - lectura_anterior, 0)


def ejecutar_recategorizacion(df_lectura_clean, df_facturacion_clean, df_facturacion_externa=None):
    """
    df_facturacion_externa: DataFrame de archivos de la carpeta 03. Reportes resumen de facturación
                            Si se proporciona, se usa para la tarifa referencia (más preciso).
                            Si es None, se usa df_facturacion_clean derivado de lecturas (fallback).
    """

    df = df_lectura_clean.sort_values(["Instalación", "Fecha de lectura"]).reset_index(drop=True)

    for col, base in [
        ("Lectura_Registro_Anterior",          "Lectura"),
        ("Motivo_Registro_Anterior",           "Motivo de lectura"),
        ("Lectura_Anterior_Registro_Anterior", "Lectura Anterior"),
        ("Fecha_Lectura_Anterior_Historica",   "Fecha de lectura"),
    ]:
        df[col] = df.groupby("Instalación")[base].shift(1)

    df["Consumo m3 calculado"] = (df["Lectura"] - df["Lectura Anterior"]).clip(lower=0)
    df["Días de consumo calculado"] = (
        (df["Fecha de lectura"] - df["Fecha de lectura anterior"])
        .dt.days.fillna(0).clip(lower=0).astype(float)
    )
    df["Consumo facturado calculado"] = df["Consumo m3 calculado"] * df["Factor de Corrección"]
    df["Periodo"] = df["Fecha de lectura"].dt.to_period("M")
    df_facturacion_clean["Periodo"] = df_facturacion_clean["Fecha de contabilización"].dt.to_period("M")

    # ── FUENTE DE FACTURACIÓN ─────────────────────────────────────────────────
    # Si se proporcionan archivos externos de facturación (carpeta 03), usarlos
    # De lo contrario usar el fallback derivado de lecturas
    if df_facturacion_externa is not None:
        df_facturacion_externa["Periodo"] = df_facturacion_externa["Fecha de contabilización"].dt.to_period("M")
        df_fact_para_tarifa = df_facturacion_externa
        print("   📊 Usando archivos de facturación externos")
    else:
        df_fact_para_tarifa = df_facturacion_clean
        print("   📊 Usando tarifa derivada de archivos de lectura (fallback)")

    # ── VENTANA FIJA DE 6 MESES ───────────────────────────────────────────────
    ultimo_periodo   = df["Periodo"].max()
    meses_a_usar     = NUM_MESES
    periodos_validos = pd.period_range(end=ultimo_periodo, periods=meses_a_usar, freq="M")

    # ── TARIFA REFERENCIA: última tarifa de facturación ───────────────────────
    # Igual que el notebook: última tarifa global sin filtro de vigencia
    df_tarifa_ref = (
        df_fact_para_tarifa
        .sort_values(["Cuenta contrato", "Periodo"])
        .groupby("Cuenta contrato")
        .tail(1)[["Cuenta contrato", "Tipo de tarifa de facturación"]]
        .rename(columns={"Tipo de tarifa de facturación": "Tarifa referencia"})
    )

    df = df.merge(df_tarifa_ref, on="Cuenta contrato", how="left")

    df["Estado inicial"] = np.select(
        [df["Tarifa referencia"].isna(), ~df["Tarifa referencia"].isin(TARIFAS_VIGENTES)],
        ["Cliente nuevo", "Tarifa no aplicable"],
        default="Válido"
    )

    df_para_calculos = df[df["Periodo"].isin(periodos_validos)].copy()

    lecturas_validas_mask = df_para_calculos[
        df_para_calculos["Motivo de lectura"].isin(LECTURAS_VALIDAS)
    ]
    conteo_periodos = (
        lecturas_validas_mask.groupby("Instalación")["Periodo"]
        .nunique().reset_index()
        .rename(columns={"Periodo": "meses_en_ventana"})
    )
    df_para_calculos = df_para_calculos.merge(conteo_periodos, on="Instalación", how="left")
    df_para_calculos["Apto"] = (
        (df_para_calculos["meses_en_ventana"] >= meses_a_usar) &
        (df_para_calculos["Estado inicial"] == "Válido")
    )

    df_validos = df_para_calculos[df_para_calculos["Apto"]].copy()
    df_validos["Días de consumo calculado"] = (
        (df_validos["Fecha de lectura"] - df_validos["Fecha de lectura anterior"])
        .dt.days.fillna(0).clip(lower=0).astype(float)
    )

    primer_mes = (
        df_validos.sort_values(["Instalación", "Periodo"])
        .groupby("Instalación").first().reset_index()
        [["Instalación", "Motivo de lectura"]]
    )
    primer_mes["requiere_historico"] = primer_mes["Motivo de lectura"].isin([13, 18, 21, 22])
    df_validos = df_validos.merge(
        primer_mes[["Instalación", "requiere_historico"]], on="Instalación", how="left"
    )
    df_validos["historico_valido"] = (
        ~df_validos["requiere_historico"] |
        (df_validos["Lectura_Registro_Anterior"].notna() &
         df_validos["Motivo_Registro_Anterior"].isin(LECTURAS_VALIDAS))
    )
    df_validos = df_validos[
        ~((df_validos["requiere_historico"] == True) &
          (df_validos["historico_valido"] == False))
    ].copy()

    df_validos["Días de consumo calculado"] = (
        (df_validos["Fecha de lectura"] - df_validos["Fecha de lectura anterior"])
        .dt.days.fillna(0).clip(lower=0).astype(float)
    )

    df_validos = df_validos.sort_values(["Instalación", "Periodo"])
    df_validos["numero_mes_ventana"] = (
        df_validos.groupby("Instalación")["Periodo"]
        .transform(lambda x: pd.factorize(x)[0] + 1)
    )

    # ── CONSUMO MENSUAL: groupby.apply exacto igual al notebook ──────────────
    EVENTOS = [13, 18, 22, 21]
    inst_complejas = set(
        df_validos[df_validos["Motivo de lectura"].isin(EVENTOS)]["Instalación"].unique()
    )
    df_simples   = df_validos[~df_validos["Instalación"].isin(inst_complejas)].copy()
    df_complejos = df_validos[df_validos["Instalación"].isin(inst_complejas)].copy()

    print(f"   ⚡ Simples (vectorizado): {df_simples['Instalación'].nunique():,}")
    print(f"   🔧 Complejos (apply):     {df_complejos['Instalación'].nunique():,}")

    # Simples: apply igual al notebook
    df_consumo_simples = (
        df_simples.groupby(["Instalación", "Periodo"])
        .apply(_calcular_consumo_mensual, include_groups=False)
        .reset_index(name="Consumo m3 ajustado")
    )

    # Complejos: apply igual al notebook
    df_consumo_complejos = (
        df_complejos.groupby(["Instalación", "Periodo"])
        .apply(_calcular_consumo_mensual, include_groups=False)
        .reset_index(name="Consumo m3 ajustado")
    )

    df_consumo_mensual = pd.concat(
        [df_consumo_simples, df_consumo_complejos], ignore_index=True
    )
    print("   ✅ Consumo mensual calculado")

    dias_backup = (
        df_validos.groupby(["Instalación", "Periodo"])["Días de consumo calculado"]
        .sum().reset_index()
    )

    df_mensual = (
        df_validos.groupby(["Instalación", "Periodo"], as_index=False)
        .agg({
            "Cuenta contrato":      "first",
            "Factor de Corrección": "mean",
            "Tarifa referencia":    "first",
            "Porción":              "first",
            "Unidad Predial":       "first",
        })
    )
    df_mensual = df_mensual.merge(df_consumo_mensual, on=["Instalación", "Periodo"], how="left")
    df_mensual = df_mensual.merge(dias_backup,         on=["Instalación", "Periodo"], how="left")
    df_mensual["Días de consumo calculado"] = (
        pd.to_numeric(df_mensual["Días de consumo calculado"], errors="coerce").fillna(0).clip(lower=0)
    )
    df_mensual["Consumo_mes"] = (
        df_mensual["Consumo m3 ajustado"] * df_mensual["Factor de Corrección"]
    ).clip(lower=0)
    df_mensual = df_mensual.rename(columns={
        "Cuenta contrato":           "Cuenta_contrato",
        "Días de consumo calculado": "Dias_mes",
        "Tarifa referencia":         "Tarifa_referencia",
        "Porción":                   "Porcion",
        "Unidad Predial":            "Unidad_Predial",
    })

    # CUADRO 2
    cuadro_2 = (
        df_mensual.groupby("Instalación")
        .agg(
            Cuenta_contrato         =("Cuenta_contrato",          "first"),
            Total_dias_consumo      =("Dias_mes",                 "sum"),
            Total_consumo_facturado =("Consumo_mes",              "sum"),
            Tarifa_referencia       =("Tarifa_referencia",        "first"),
            Porcion                 =("Porcion",                  "first"),
            Unidad_Predial          =("Unidad_Predial",           "first"),
        ).reset_index()
    )
    cuadro_2["Promedio_diario"] = (
        cuadro_2["Total_consumo_facturado"] /
        cuadro_2["Total_dias_consumo"].replace(0, np.nan)
    ).fillna(0)
    cuadro_2["Promedio_mensual"]            = cuadro_2["Promedio_diario"] * DIAS_ESTANDAR_MES
    cuadro_2["Promedio_mensual_redondeado"] = cuadro_2["Promedio_mensual"].apply(_redondear)
    cuadro_2["Nueva_tarifa"] = cuadro_2["Promedio_mensual_redondeado"].apply(_asignar_tarifa)
    cuadro_2["Estado"] = np.where(
        cuadro_2["Nueva_tarifa"] == cuadro_2["Tarifa_referencia"],
        "Sin cambio", "Recategorizado"
    )

    # CUADRO 3
    cuadro_3 = (
        cuadro_2.groupby(["Tarifa_referencia", "Nueva_tarifa"])
        .size().reset_index()
        .rename(columns={0: "Cantidad_clientes"})
    )
    total_c3 = cuadro_3["Cantidad_clientes"].sum()
    cuadro_3["Porcentaje"] = cuadro_3["Cantidad_clientes"] / total_c3 * 100

    # CUADRO 4
    df_no_aptos = df_para_calculos[~df_para_calculos["Apto"]].copy()

    def _observacion(row):
        obs = []
        if pd.notna(row.get("meses_en_ventana")) and row["meses_en_ventana"] < meses_a_usar:
            obs.append(f"Menos de 6 meses de historial ({int(row['meses_en_ventana'])} meses)")
        if row["Estado inicial"] == "Tarifa no aplicable":
            obs.append(f"Tarifa no válida para recategorización ({row['Tarifa referencia']})")
        elif row["Estado inicial"] == "Cliente nuevo":
            obs.append("Cliente nuevo sin historial de facturación")
        if row.get("requiere_historico") and not row.get("historico_valido"):
            obs.append("Evento operativo sin lectura histórica válida")
        if pd.isna(row.get("Factor de Corrección")) or pd.isna(row.get("Lectura")):
            obs.append("Datos incompletos para cálculo")
        return "; ".join(obs) if obs else "No cumple criterios de elegibilidad"

    df_no_aptos["Observación"] = df_no_aptos.apply(_observacion, axis=1)

    cuentas_en_ventana    = set(df_para_calculos["Cuenta contrato"].astype(str).str.strip().unique())
    cuentas_totales       = set(df["Cuenta contrato"].astype(str).str.strip().unique())
    cuentas_fuera_ventana = cuentas_totales - cuentas_en_ventana

    if cuentas_fuera_ventana:
        df_fuera_ventana = df[
            df["Cuenta contrato"].astype(str).str.strip().isin(cuentas_fuera_ventana)
        ][["Cuenta contrato", "Instalación", "Tarifa referencia", "Porción", "Unidad Predial"]].drop_duplicates().copy()
        df_fuera_ventana["Observación"]      = "Sin lecturas en ventana de evaluación (6 meses)"
        df_fuera_ventana["meses_en_ventana"] = 0
        df_fuera_ventana["Estado inicial"]   = "Fuera de ventana"
        df_no_aptos = pd.concat([df_no_aptos, df_fuera_ventana], ignore_index=True)

    cuadro_4 = df_no_aptos[[
        "Cuenta contrato", "Instalación", "Tarifa referencia",
        "Observación", "Porción", "Unidad Predial",
        "meses_en_ventana", "Estado inicial"
    ]].drop_duplicates(subset=["Cuenta contrato", "Instalación"])

    print(f"   • Cuadro 2: {len(cuadro_2):,} clientes aptos")
    print(f"   • Cuadro 4: {len(cuadro_4):,} clientes no aptos")
    print(f"   • Total:    {len(cuadro_2) + cuadro_4['Cuenta contrato'].nunique():,}")

    # CUADRO 5
    df_todos = df.sort_values(["Instalación", "Fecha de lectura"]).copy()
    df_todos["Lectura_Previa"] = df_todos.groupby("Instalación")["Lectura"].shift(1)

    frames = []
    eventos_map = {
        13: "Corte de servicio",
        18: "Reconexión de servicio",
        22: "Desmontaje de medidor",
        21: "Montaje de medidor"
    }
    for cod, desc in eventos_map.items():
        mask = df_todos["Motivo de lectura"] == cod
        if mask.any():
            tmp = df_todos[mask][["Cuenta contrato", "Instalación", "Fecha de lectura"]].copy()
            tmp["Tipo_anomalia"] = desc
            frames.append(tmp)

    mask = (
        df_todos["Lectura_Previa"].notna() &
        df_todos["Lectura Anterior"].notna() &
        (abs(df_todos["Lectura_Previa"] - df_todos["Lectura Anterior"]) > 0.01)
    )
    if mask.any():
        tmp = df_todos[mask][["Cuenta contrato", "Instalación", "Fecha de lectura", "Lectura_Previa", "Lectura Anterior"]].copy()
        tmp["Tipo_anomalia"] = (
            "Ruptura patrón diagonal (" +
            tmp["Lectura_Previa"].map("{:.0f}".format) + "≠" +
            tmp["Lectura Anterior"].map("{:.0f}".format) + ")"
        )
        tmp = tmp.drop(columns=["Lectura_Previa", "Lectura Anterior"])
        frames.append(tmp)

    mask = (
        (df_todos["Lectura"] == df_todos["Lectura Anterior"]) &
        (df_todos["Consumo m3 calculado"] > 0)
    )
    if mask.any():
        tmp = df_todos[mask][["Cuenta contrato", "Instalación", "Fecha de lectura"]].copy()
        tmp["Tipo_anomalia"] = "Consumo sin cambio de lectura"
        frames.append(tmp)

    mask = (
        df_todos["Lectura_Previa"].notna() &
        (df_todos["Lectura"] > 0) &
        ((df_todos["Lectura_Previa"] / df_todos["Lectura"] > 10) |
         (df_todos["Lectura_Previa"] / df_todos["Lectura"] < 0.1))
    )
    if mask.any():
        tmp = df_todos[mask][["Cuenta contrato", "Instalación", "Fecha de lectura", "Lectura_Previa", "Lectura"]].copy()
        tmp["Tipo_anomalia"] = (
            "Posible error de digitación (" +
            tmp["Lectura_Previa"].map("{:.0f}".format) + "→" +
            tmp["Lectura"].map("{:.0f}".format) + ")"
        )
        tmp = tmp.drop(columns=["Lectura_Previa", "Lectura"])
        frames.append(tmp)

    mask = df_todos["Lectura"] < 0
    if mask.any():
        tmp = df_todos[mask][["Cuenta contrato", "Instalación", "Fecha de lectura"]].copy()
        tmp["Tipo_anomalia"] = "Lectura negativa"
        frames.append(tmp)

    mask = (df_todos["Lectura"] == 0) & (df_todos["Motivo de lectura"] == 1)
    if mask.any():
        tmp = df_todos[mask][["Cuenta contrato", "Instalación", "Fecha de lectura"]].copy()
        tmp["Tipo_anomalia"] = "Lectura periódica en cero"
        frames.append(tmp)

    mask = df_todos["Consumo m3 calculado"] < 0
    if mask.any():
        tmp = df_todos[mask][["Cuenta contrato", "Instalación", "Fecha de lectura"]].copy()
        tmp["Tipo_anomalia"] = "Consumo negativo"
        frames.append(tmp)

    if frames:
        cuadro_5 = pd.concat(frames, ignore_index=True).rename(columns={
            "Cuenta contrato":  "Cuenta_contrato",
            "Instalación":      "Instalacion",
            "Fecha de lectura": "Fecha",
        })
    else:
        cuadro_5 = pd.DataFrame(columns=["Cuenta_contrato", "Instalacion", "Fecha", "Tipo_anomalia"])

    return cuadro_2, cuadro_3, cuadro_4, cuadro_5, df_mensual