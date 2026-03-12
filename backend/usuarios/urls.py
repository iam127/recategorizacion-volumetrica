from django.urls import path
from . import views

urlpatterns = [
    path('register/',           views.register,        name='register'),
    path('login/',              views.login,           name='login'),
    path('perfil/',             views.perfil,          name='perfil'),
    path('cambiar-password/',   views.cambiar_password, name='cambiar_password'),
    path('usuarios/',           views.lista_usuarios,  name='lista_usuarios'),
    path('usuarios/<int:pk>/toggle/', views.toggle_usuario, name='toggle_usuario'),
]