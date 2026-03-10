from django.urls import path
from .views import (
    ImportarExcelView, DashboardStatsView, ClientesListView,
    HistorialImportacionesView, ExportarExcelView, ComparativaView,
)

urlpatterns = [
    path("importar/",          ImportarExcelView.as_view()),
    path("dashboard/stats/",   DashboardStatsView.as_view()),
    path("clientes/",          ClientesListView.as_view()),
    path("historial/",         HistorialImportacionesView.as_view()),
    path("exportar-excel/",    ExportarExcelView.as_view()),
    path("comparativa/",       ComparativaView.as_view()),
]