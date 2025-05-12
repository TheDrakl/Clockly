from rest_framework import serializers
from ..models import CustomUser
from django.contrib.auth import authenticate, get_user_model

User = get_user_model()


class LoginSerializer(serializers.Serializer): 
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            request=self.context.get('request'),
            email=data['email'],
            password=data['password']
        )

        if user is None:
            raise serializers.ValidationError("Invalid login or password!")
        
        data['user'] = user
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField()

    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'username', 'password2']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        password = data['password']
        if password != data['password2']:
            raise serializers.ValidationError('Passwords must match!')
        return data
    
    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            username=validated_data['username'],
            is_active=False
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    

class VerifyCodeSerializer(serializers.Serializer):
    verification_code = serializers.CharField()
    email = serializers.CharField()


class ResendCodeSerializer(serializers.Serializer):
    email = serializers.CharField()

