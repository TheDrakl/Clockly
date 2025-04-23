from rest_framework.response import Response
from rest_framework.viewsets import generics
from rest_framework.views import APIView
from rest_framework import status
from .serializers import LoginSerializer, RegisterSerializer
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from ..models import CustomUser

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


class LoginAPIView(APIView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            access_token = AccessToken.for_user(user)
            refresh_token = RefreshToken.for_user(user)

            return Response({
                "msg": "Successfully logged in!",
                "access_token": str(access_token),
                "refresh_token": str(refresh_token),
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        
    

class RegisterAPIView(APIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            access_token = AccessToken.for_user(user)
            refresh_token = RefreshToken.for_user(user)
            return Response({
                "msg": "Account was created successfully!",
                "access_token": str(access_token),
                "refresh_token": str(refresh_token),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                        

class GoogleAuthAPIView(APIView):
    def post(self, request):
        token = self.request.data.get('token')
        if not token:
            return Response({"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
            email = idinfo['email']
            name = idinfo.get('name', '')
            picture = idinfo.get('picture')

            user, created = CustomUser.objects.get_or_create(email=email, defaults={
                'username': email,
                'username': name,
            })

            refresh = RefreshToken.for_user(user)
            access = AccessToken.for_user(user)

            return Response({
                "access_token": str(access),
                "refresh_token": str(refresh)
            }, status=status.HTTP_200_OK)
        
        except ValueError:
            return Response({
                "error": "Invalid token"
            }, status=status.HTTP_400_BAD_REQUEST)
