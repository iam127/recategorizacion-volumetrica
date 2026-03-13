from django.urls import path
from .views import (
    ImportarExcelView,
    DashboardStatsView,
    ClientesListView,
    HistorialImportacionesView,
    ExportarExcelView,
    ComparativaView,
    FiltrosDashboardView,
)

urlpatterns = [
    path('importar/',          ImportarExcelView.as_view(),          name='importar'),
    path('dashboard/stats/',   DashboardStatsView.as_view(),         name='dashboard_stats'),
    path('clientes/',          ClientesListView.as_view(),           name='clientes'),
    path('historial/',         HistorialImportacionesView.as_view(), name='historial'),
    path('exportar-excel/',    ExportarExcelView.as_view(),          name='exportar_excel'),
    path('comparativa/',       ComparativaView.as_view(),            name='comparativa'),
    path('dashboard/filtros/', FiltrosDashboardView.as_view(),       name='filtros_dashboard'),
]