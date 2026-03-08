from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from django.db.models import Count, Q
from .etl import cargar_excel, limpiar_datos, ejecutar_recategorizacion
from .models import ResultadoImportacion, Cliente, ResumenTarifario, ClienteNoApto, Anomalia
import pandas as pd


class ImportarExcelView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        archivo_lectura = request.FILES.get("archivo_lectura")

        if not archivo_lectura:
            return Response(
                {"error": "Se requiere el archivo de lecturas"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            df_lectura, df_facturacion = cargar_excel(archivo_lectura)
            df_lectura, df_facturacion = limpiar_datos(df_lectura, df_facturacion)
            cuadro_2, cuadro_3, cuadro_4, cuadro_5 = ejecutar_recategorizacion(df_lectura, df_facturacion)

            total_clientes  = len(cuadro_2)
            recategorizados = int((cuadro_2["Estado"] == "Recategorizado").sum())
            sin_cambios     = int((cuadro_2["Estado"] == "Sin cambio").sum())
            no_aptos        = len(cuadro_4)
            anomalias       = len(cuadro_5)

            importacion = ResultadoImportacion.objects.create(
                usuario         = request.user,
                total_registros = total_clientes + no_aptos,
                procesados      = total_clientes,
                recategorizados = recategorizados,
                sin_cambios     = sin_cambios,
                no_aptos        = no_aptos,
                anomalias       = anomalias,
            )

            clientes_bulk = []
            for _, row in cuadro_2.iterrows():
                clientes_bulk.append(Cliente(
                    importacion         = importacion,
                    instalacion         = str(row["Instalación"]),
                    cuenta_contrato     = str(row["Cuenta_contrato"]),
                    total_dias_consumo  = float(row["Total_dias_consumo"] or 0),
                    total_consumo       = float(row["Total_consumo_facturado"] or 0),
                    promedio_diario     = float(row["Promedio_diario"] or 0),
                    promedio_mensual    = float(row["Promedio_mensual_redondeado"] or 0),
                    tarifa_anterior     = str(row["Tarifa_referencia"] or ""),
                    tarifa_nueva        = str(row["Nueva_tarifa"] or ""),
                    estado              = str(row["Estado"] or ""),
                    porcion             = str(row["Porcion"]) if pd.notna(row["Porcion"]) else None,
                    unidad_predial      = str(row["Unidad_Predial"]) if pd.notna(row["Unidad_Predial"]) else None,
                ))
            Cliente.objects.bulk_create(clientes_bulk, batch_size=500)

            resumenes_bulk = []
            for _, row in cuadro_3.iterrows():
                resumenes_bulk.append(ResumenTarifario(
                    importacion       = importacion,
                    tarifa_anterior   = str(row["Tarifa_referencia"]),
                    tarifa_nueva      = str(row["Nueva_tarifa"]),
                    cantidad_clientes = int(row["Cantidad_clientes"]),
                    porcentaje        = float(row["Porcentaje"]),
                ))
            ResumenTarifario.objects.bulk_create(resumenes_bulk)

            no_aptos_bulk = []
            for _, row in cuadro_4.iterrows():
                no_aptos_bulk.append(ClienteNoApto(
                    importacion       = importacion,
                    cuenta_contrato   = str(row["Cuenta contrato"] or ""),
                    instalacion       = str(row["Instalación"] or ""),
                    tarifa_referencia = str(row["Tarifa referencia"]) if pd.notna(row.get("Tarifa referencia")) else None,
                    observacion       = str(row["Observación"] or ""),
                    porcion           = str(row["Porción"]) if pd.notna(row.get("Porción")) else None,
                    unidad_predial    = str(row["Unidad Predial"]) if pd.notna(row.get("Unidad Predial")) else None,
                    meses_en_ventana  = float(row["meses_en_ventana"]) if pd.notna(row.get("meses_en_ventana")) else None,
                    estado_inicial    = str(row["Estado inicial"]) if pd.notna(row.get("Estado inicial")) else None,
                ))
            ClienteNoApto.objects.bulk_create(no_aptos_bulk, batch_size=500)

            if len(cuadro_5) > 0:
                anomalias_bulk = []
                for _, row in cuadro_5.iterrows():
                    anomalias_bulk.append(Anomalia(
                        importacion     = importacion,
                        cuenta_contrato = str(row["Cuenta_contrato"] or ""),
                        instalacion     = str(row["Instalacion"] or ""),
                        fecha           = row["Fecha"] if pd.notna(row["Fecha"]) else None,
                        tipo_anomalia   = str(row["Tipo_anomalia"] or ""),
                    ))
                Anomalia.objects.bulk_create(anomalias_bulk, batch_size=500)

            return Response({
                "total":                   total_clientes + no_aptos,
                "procesados":              total_clientes,
                "recategorizados":         recategorizados,
                "sin_cambios":             sin_cambios,
                "no_aptos":                no_aptos,
                "errores":                 0,
                "anomalias":               anomalias,
                "distribucion_categorias": cuadro_2["Nueva_tarifa"].value_counts().to_dict(),
                "cambios_tarifarios":      cuadro_3.to_dict("records"),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            error_detalle = traceback.format_exc()
            print(error_detalle)
            return Response(
                {"error": f"Error procesando archivos: {str(e)}", "detalle": error_detalle},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ultima = ResultadoImportacion.objects.filter(usuario=request.user).first()
        if not ultima:
            return Response({
                "total_clientes":          0,
                "recategorizados":         0,
                "sin_cambios":             0,
                "no_aptos":                0,
                "anomalias":               0,
                "distribucion_categorias": [],
                "cambios_tarifarios":      [],
                "no_aptos_observaciones":  [],
                "anomalias_por_tipo":      [],
            })

        dist = (
            Cliente.objects.filter(importacion=ultima)
            .values("tarifa_nueva")
            .annotate(cantidad=Count("id"))
        )

        cambios = (
            ResumenTarifario.objects.filter(importacion=ultima)
            .values("tarifa_anterior", "tarifa_nueva", "cantidad_clientes", "porcentaje")
        )

        no_aptos_obs = (
            ClienteNoApto.objects.filter(importacion=ultima)
            .values("observacion")
            .annotate(cantidad=Count("id"))
            .order_by("-cantidad")[:6]
        )

        anomalias_tipo = (
            Anomalia.objects.filter(importacion=ultima)
            .values("tipo_anomalia")
            .annotate(cantidad=Count("id"))
            .order_by("-cantidad")[:6]
        )

        return Response({
            "total_clientes":          ultima.total_registros,
            "recategorizados":         ultima.recategorizados,
            "sin_cambios":             ultima.sin_cambios,
            "no_aptos":                ultima.no_aptos,
            "anomalias":               ultima.anomalias,
            "distribucion_categorias": list(dist),
            "cambios_tarifarios":      list(cambios),
            "no_aptos_observaciones":  list(no_aptos_obs),
            "anomalias_por_tipo":      list(anomalias_tipo),
        })


class ClientesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ultima = ResultadoImportacion.objects.filter(usuario=request.user).first()
        if not ultima:
            return Response({"count": 0, "results": []})

        search = request.query_params.get("search", "")
        page   = int(request.query_params.get("page", 1))
        size   = int(request.query_params.get("page_size", 10))

        qs = Cliente.objects.filter(importacion=ultima)
        if search:
            qs = qs.filter(
                Q(instalacion__icontains=search) |
                Q(cuenta_contrato__icontains=search) |
                Q(porcion__icontains=search)
            )

        total    = qs.count()
        offset   = (page - 1) * size
        clientes = qs[offset:offset + size]

        results = [{
            "id":                          c.id,
            "Instalación":                 c.instalacion,
            "Cuenta_contrato":             c.cuenta_contrato,
            "Total_dias_consumo":          round(c.total_dias_consumo, 2),
            "Total_consumo_facturado":     round(c.total_consumo, 2),
            "Tarifa_referencia":           c.tarifa_anterior,
            "Porcion":                     c.porcion or "-",
            "Unidad_Predial":              c.unidad_predial or "-",
            "Promedio_diario":             round(c.promedio_diario, 4),
            "Promedio_mensual":            round(c.promedio_mensual, 2),
            "Promedio_mensual_redondeado": int(c.promedio_mensual),
            "Nueva_tarifa":                c.tarifa_nueva,
            "Estado":                      c.estado,
        } for c in clientes]

        return Response({"count": total, "results": results})