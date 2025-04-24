from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .views import LoginAPIView, RegisterAPIView, GoogleAuthAPIView, VerifyCodeAPIView

urlpatterns = [
    # JWT Token Endpoints
    path('token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),

    # Login Endpoints
    path('login/', LoginAPIView.as_view(), name='login'),
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('verify/', VerifyCodeAPIView.as_view(), name='verify-code'),

    # OAuth Endpoints
    path('oauth/google/', GoogleAuthAPIView.as_view(), name='google-auth')
]