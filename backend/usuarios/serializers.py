from rest_framework import serializers
from django.contrib.auth import get_user_model

Usuario = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirmPassword = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'email', 'password', 'confirmPassword']

    def validate(self, data):
        if data['password'] != data['confirmPassword']:
            raise serializers.ValidationError({'confirmPassword': 'Las contraseñas no coinciden'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirmPassword')
        return Usuario.objects.create_user(**validated_data)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'rol', 'fecha_creacion']