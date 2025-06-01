from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    LoginAPIView,
    RegisterAPIView,
    GoogleAuthAPIView,
    VerifyCodeAPIView,
    ResendCodeAPIView,
    LogoutAPIView,
    CheckAuth,
    CustomTokenRefreshView,
    ServiceListCreateAPIView,
    ServiceRetrieveUpdateDestroyAPIVIew,
    AvailabilitySlotListCreateAPIView,
    AvailabilitySlotRetrieveUpdateDestroyAPIVIew,
    BookingRetrieveUpdateDestroyAPIVIew,
    DashboardAPIView,
    BookingSlotClientListCreateAPIView,
    AvailableTimesView,
    BookTimeView,
    ServicesListAPIView,
    VerifyBookTimeAPIView,
)

urlpatterns = [
    # JWT Token Endpoints
    path("auth/token/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("auth/token/refresh/", CustomTokenRefreshView.as_view(), name="token-refresh"),
    path("auth/token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    # Login Endpoints
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),
    path("auth/check-auth/", CheckAuth.as_view(), name="check-auth"),
    path("auth/verify/", VerifyCodeAPIView.as_view(), name="verify-code"),
    path("auth/verify/resend/", ResendCodeAPIView.as_view(), name="resend-verify-code"),
    # OAuth Endpoints
    path("auth/oauth/google/", GoogleAuthAPIView.as_view(), name="google-auth"),
    
    # Client
    path("client/services/", ServiceListCreateAPIView.as_view(), name="services"),
    path(
        "services/<int:id>/",
        ServiceRetrieveUpdateDestroyAPIVIew.as_view(),
        name="service-detail",
    ),
    path(
        "client/availability-slots/", AvailabilitySlotListCreateAPIView.as_view(), name="slots"
    ),
    path(
        "client/availability-slots/<int:id>/",
        AvailabilitySlotRetrieveUpdateDestroyAPIVIew.as_view(),
        name="slot-detail",
    ),
    path("client/bookings/", BookingSlotClientListCreateAPIView.as_view(), name="bookings"),
    path(
        "bookings/<int:id>/",
        BookingRetrieveUpdateDestroyAPIVIew.as_view(),
        name="booking-detai;",
    ),

    # Dashboard
    path("client/me/", DashboardAPIView.as_view(), name="dashboard"),
    path(
        "bookings/book/verify/<str:token>/",
        VerifyBookTimeAPIView.as_view(),
        name="verify-booking",
    ),
    path("bookings/services/<str:user_slug>/", ServicesListAPIView.as_view(), name="services"),
    path("bookings/<str:user_slug>/<int:service_id>/<str:date>/", AvailableTimesView.as_view()),
    path(
        "bookings/<str:user_slug>/<str:date>/",
        AvailableTimesView.as_view(),
        name="available-times-no-service",
    ),
    path(
        "bookings/book/<str:user_slug>/<int:service_id>/<str:date>/",
        BookTimeView.as_view(),
        name="book-appointment",
    ),
]
