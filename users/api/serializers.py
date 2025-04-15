from rest_framework import serializers
from ..models import CustomUser
from django.contrib.auth import authenticate, get_user_model

User = get_user_model()

class LoginSerializer(serializers.Serializer): 
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):

        user = authenticate(email=data['email'], password=data['password'])

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
        validated_data.pop('password2')

        user = User.objects.create(email=validated_data['email'], username=validated_data['username'], password=validated_data['password'])
        return user


