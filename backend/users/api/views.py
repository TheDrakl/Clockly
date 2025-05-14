from rest_framework.response import Response
from rest_framework.viewsets import generics
from rest_framework.views import APIView
from rest_framework import status
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    VerifyCodeSerializer,
    ResendCodeSerializer,
)
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from core.tasks import send_registration_code, send_registration_success
from ..models import CustomUser, VerificationCode
from core.tasks import send_registration_code
from core.utils.verification import create_verification_code
from django.http import Http404
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import timedelta
from django.utils import timezone
from rest_framework.throttling import UserRateThrottle
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken


User = get_user_model()


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request):
        old_refresh_token = request.COOKIES.get("refresh_token")

        if not old_refresh_token:
            return Response(
                {"error": "refresh_token doesn't exist in cookies"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh_token = RefreshToken(old_refresh_token)

            access_token = str(refresh_token.access_token)
            new_refresh_token = str(refresh_token)

            res = Response(status=status.HTTP_200_OK)

            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="None",
                max_age=3600,
            )

            res.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                httponly=True,
                secure=True,
                samesite="None",
                max_age=7 * 24 * 3600,
            )

            return res

        except Exception as e:
            return Response(
                {"error": "Invalid refresh token", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LoginAPIView(APIView):
    serializer_class = LoginSerializer
    throttle_classes = [UserRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            access_token = AccessToken.for_user(user)
            refresh_token = RefreshToken.for_user(user)

            res = Response(
                {"message": "Successfully logged in!"}, status=status.HTTP_200_OK
            )

            res.set_cookie(
                key="access_token",
                value=str(access_token),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=30 * 60,
            )

            res.set_cookie(
                key="refresh_token",
                value=str(refresh_token),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=7 * 24 * 60 * 60,
            )

            return res

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterAPIView(APIView):
    serializer_class = RegisterSerializer
    throttle_classes = [UserRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data["email"]

            user = serializer.save()

            VerificationCode.objects.filter(email=email).delete()

            create_verification_code(email=email)

            return Response(
                {"detail": f"Verification code was sent to {user.email}!"},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyCodeAPIView(APIView):
    serializer_class = VerifyCodeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            verification_code = serializer.validated_data["verification_code"]
            try:
                verification_code_obj = get_object_or_404(
                    VerificationCode,
                    email=serializer.validated_data["email"],
                    code=verification_code,
                )
            except Http404:
                return Response(
                    {"error": "Invalid verification code!"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if verification_code_obj.is_expired():
                return Response(
                    {"error": "Verification code has expired!"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = get_object_or_404(CustomUser, email=email)
            user.is_active = True
            user.save()
            VerificationCode.objects.filter(email=user.email).delete()
            send_registration_success(user_email=user.email)
            access_token = AccessToken.for_user(user)
            refresh_token = RefreshToken.for_user(user)

            res = Response()

            res.set_cookie(
                key="access_token",
                value=str(access_token),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=30 * 60,
            )

            res.set_cookie(
                key="refresh_token",
                value=str(refresh_token),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=7 * 24 * 60 * 60,
            )

            return res

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendCodeAPIView(APIView):
    serializer_class = ResendCodeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                code = VerificationCode.objects.get(email=email)
            except ObjectDoesNotExist:
                return Response(
                    {"detail": "No verification code found for this email."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not code.can_resend():
                remaining_time = code.created_at + timedelta(minutes=5) - timezone.now()
                return Response(
                    {
                        "detail": f"You need to wait {remaining_time.seconds} seconds before requesting a new code."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            VerificationCode.objects.filter(email=email).delete()
            create_verification_code(email=email)

            return Response(
                {"detail": f"Verification code has been resent to {email}!"},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleAuthAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        print(">>> GoogleAuthAPIView called")
        print("Token from frontend:", request.data.get("token"))
        token = self.request.data.get("token")
        if not token:
            return Response(
                {"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            print("STARTING")
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
            email = idinfo["email"]
            name = idinfo.get("name", "")
            picture = idinfo.get("picture")

            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={
                    "username": name,
                    "email": email,
                },
            )

            if created:
                user.set_unusable_password()
                user.is_active = True
                user.save()

            refresh = RefreshToken.for_user(user)
            access = AccessToken.for_user(user)

            res = Response(
                {"message": "Successfully logged in!"}, status=status.HTTP_200_OK
            )

            res.set_cookie(
                key="access_token",
                value=str(access),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=30 * 60,
            )

            res.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=7 * 24 * 60 * 60,
            )

            return res

        except ValueError:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        res = Response(status=200)

        res.set_cookie(
            key="access_token",
            value="",
            httponly=True,
            secure=True,
            samesite="None",
            max_age=0,
        )

        res.set_cookie(
            key="refresh_token",
            value="",
            httponly=True,
            secure=True,
            samesite="None",
            max_age=0,
        )

        return res


class CheckAuth(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        refresh = request.COOKIES.get("refresh_token")

        if not refresh:
            return Response(
                {"is_authenticated": False, "error": "No token found"}, status=401
            )

        try:
            token = RefreshToken(refresh)
            user_id = token.payload.get("user_id")

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {
                        "is_authenticated": False,
                        "error": "User not found. Please log in again.",
                    },
                    status=401,
                )

            token.check_exp()
            return Response({"is_authenticated": True})

        except TokenError as e:
            return Response(
                {
                    "is_authenticated": False,
                    "error": "Refresh token expired or invalid. Please log in again.",
                    "detail": str(e),
                },
                status=401,
            )