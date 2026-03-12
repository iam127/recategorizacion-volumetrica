from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .serializers import RegisterSerializer, UsuarioSerializer, UpdatePerfilSerializer
from operaciones.models import ResultadoImportacion


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': UsuarioSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=email, password=password)

    if user is None:
        return Response(
            {'error': 'Correo o contraseña incorrectos'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.activo:
        return Response(
            {'error': 'Tu cuenta está desactivada'},
            status=status.HTTP_403_FORBIDDEN
        )

    user.ultimo_acceso = timezone.now()
    user.save(update_fields=['ultimo_acceso'])

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Login exitoso',
        'user': UsuarioSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def perfil(request):
    if request.method == 'GET':
        return Response(UsuarioSerializer(request.user).data)

    serializer = UpdatePerfilSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(UsuarioSerializer(serializer.instance).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    user         = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not user.check_password(old_password):
        return Response(
            {'error': 'Contraseña actual incorrecta'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_password) < 6:
        return Response(
            {'error': 'La nueva contraseña debe tener al menos 6 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()
    return Response({'message': 'Contraseña actualizada correctamente'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lista_usuarios(request):
    if request.user.rol != 'admin':
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    usuarios = User.objects.all().order_by('-fecha_creacion')

    data = []
    for u in usuarios:
        total_importaciones = ResultadoImportacion.objects.filter(usuario=u).count()
        data.append({
            'id':                  u.id,
            'nombre':              u.nombre,
            'apellido':            u.apellido,
            'email':               u.email,
            'rol':                 u.rol,
            'is_active':           u.activo,
            'total_importaciones': total_importaciones,
        })

    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_usuario(request, pk):
    if request.user.rol != 'admin':
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        usuario = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if usuario == request.user:
        return Response({'error': 'No puedes desactivar tu propia cuenta'}, status=status.HTTP_400_BAD_REQUEST)

    usuario.activo = not usuario.activo
    usuario.save(update_fields=['activo'])

    return Response({
        'id':        usuario.id,
        'is_active': usuario.activo,
        'message':   f'Usuario {"activado" if usuario.activo else "desactivado"} correctamente'
    })