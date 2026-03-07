from rest_framework import serializers
from .models import Usuario


class RegisterSerializer(serializers.ModelSerializer):
    confirmPassword = serializers.CharField(write_only=True)
    rol = serializers.CharField(default='usuario')

    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email', 'password', 'confirmPassword', 'rol']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if data['password'] != data['confirmPassword']:
            raise serializers.ValidationError({'confirmPassword': 'Las contraseñas no coinciden'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirmPassword')
        rol = validated_data.pop('rol', 'usuario')
        user = Usuario.objects.create_user(**validated_data)
        user.rol = rol
        user.save()
        return user


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'rol', 'fecha_creacion']


class UpdatePerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email']