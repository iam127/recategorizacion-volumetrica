from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('usuarios.urls')),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/operaciones/", include("operaciones.urls")),
    path("api/dashboard/",   include("operaciones.urls")),
    path("api/clientes/",    include("operaciones.urls")),
]
