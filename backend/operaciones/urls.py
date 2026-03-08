from django.urls import path
from .views import ImportarExcelView, DashboardStatsView, ClientesListView

urlpatterns = [
    path("importar/",        ImportarExcelView.as_view(),   name="importar-excel"),
    path("dashboard/stats/", DashboardStatsView.as_view(),  name="dashboard-stats"),
    path("clientes/",        ClientesListView.as_view(),    name="clientes-list"),
]