from django.shortcuts import render, get_object_or_404
from django.http import Http404
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound
from rest_framework.throttling import UserRateThrottle
from rest_framework.pagination import PageNumberPagination

from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    VerifyCodeSerializer,
    ResendCodeSerializer,
    BookingSerializer,
    AvailabilitySlotSerializer,
    ServiceSerializer,
    BookingClientSerializer,
    UserSerializer,
)

from core.models import (
    CustomUser,
    VerificationCode,
    Booking,
    AvailabilitySlot,
    Service,
    VerificationLink,
)

from core.tasks import (
    send_registration_code,
    send_registration_success,
    send_appointment_email,
)

from core.utils.verification import create_verification_code, create_verification_link
from core.utils.available_times import generate_available_times

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from datetime import datetime, timedelta
import uuid

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
        token = self.request.data.get("token")
        if not token:
            return Response(
                {"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            CLIENT_ID = settings.GOOGLE_CLIENT_ID
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), CLIENT_ID
            )
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

        except ValueError as e:
            print("Token verification error:", str(e))
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        res = Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        try:
            refresh_token = request.COOKIES.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

        res.delete_cookie("access_token", samesite="None")
        res.delete_cookie("refresh_token", samesite="None")

        return res


class CheckAuth(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        refresh = request.COOKIES.get("refresh_token")
        access = request.COOKIES.get("access_token")

        if not refresh:
            return Response(
                {"is_authenticated": False, "error": "No token found"}, status=401
            )

        try:
            token = AccessToken(access)
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


class ServiceListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Service.objects.filter(user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ServiceRetrieveUpdateDestroyAPIVIew(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Service.objects.filter(user=self.request.user)


class AvailabilitySlotListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AvailabilitySlot.objects.filter(user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AvailabilitySlotRetrieveUpdateDestroyAPIVIew(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return AvailabilitySlot.objects.filter(user=self.request.user)


class BookingSlotListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Booking.objects.filter(user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingSlotClientListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        services = ServiceSerializer(
            Service.objects.filter(user=request.user), many=True
        )
        slots = AvailabilitySlotSerializer(
            AvailabilitySlot.objects.filter(user=request.user), many=True
        )
        # bookings = BookingClientSerializer(Booking.objects.filter(user=request.user).order_by('-end_datetime'), many=True)

        bookings_qs = Booking.objects.filter(user=request.user).order_by(
            "-end_datetime"
        )

        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(bookings_qs, request)
        bookings = BookingClientSerializer(result_page, many=True)

        return Response(
            {
                "Services": services.data,
                "Slots": slots.data,
                "Bookings": bookings.data,
            }
        )

    def post(self, request, *args, **kwargs):
        serializer = BookingClientSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = self.request.user
        service_id = serializer.validated_data["service_id"]
        service = get_object_or_404(Service, id=service_id)
        date_obj = serializer.validated_data["date"]
        email_sent = serializer.validated_data["email_sent"]

        start_time = serializer.validated_data["start_time"]
        customer_name = serializer.validated_data["customer_name"]
        customer_email = serializer.validated_data["customer_email"]
        customer_phone = serializer.validated_data["customer_phone"]

        start_dt = datetime.combine(date_obj, start_time)
        end_dt = start_dt + service.duration
        end_time = end_dt.time()

        overlapping_bookings = Booking.objects.filter(
            user=user,
            start_time__lt=end_time,
            end_time__gt=start_time,
            slot__date=date_obj,
        )

        if overlapping_bookings.exists():
            return Response({"error": "Time slot already booked."}, status=400)

        try:
            slot = AvailabilitySlot.objects.get(
                user=user,
                date=date_obj,
                start_time__lte=start_time,
                end_time__gte=end_time,
                is_active=True,
            )
        except AvailabilitySlot.DoesNotExist:
            return Response({"error": "No matching available slot found."}, status=400)

        # Create booking
        booking = Booking.objects.create(
            user=user,
            service=service,
            slot=slot,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            start_time=start_time,
            end_time=end_time,
            email_sent=email_sent,
        )

        if email_sent:
            send_appointment_email.delay(
                customer_name=customer_name,
                service_name=service.name,
                appointment_date=date_obj,
                start_time=start_time,
                end_time=end_time,
                customer_email=customer_email,
            )

        return Response({"message": "Booking confirmed!"}, status=201)


class BookingRetrieveUpdateDestroyAPIVIew(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        serializer = BookingClientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.request.user
        service_id = serializer.validated_data["service_id"]
        service = get_object_or_404(Service, id=service_id)
        date_obj = serializer.validated_data["date"]
        email_sent = serializer.validated_data["email_sent"]

        start_time = serializer.validated_data["start_time"]
        customer_name = serializer.validated_data["customer_name"]
        customer_email = serializer.validated_data["customer_email"]
        customer_phone = serializer.validated_data["customer_phone"]
        booking_status = serializer.validated_data["status"]

        start_dt = datetime.combine(date_obj, start_time)
        end_dt = start_dt + service.duration
        end_time = end_dt.time()

        booking = Booking.objects.get(id=self.kwargs["id"])

        overlapping_bookings = Booking.objects.filter(
            user=user,
            start_time__lt=end_time,
            end_time__gt=start_time,
            slot__date=date_obj,
        )

        should_send_email = email_sent and not booking.email_sent

        if overlapping_bookings.exists() and booking not in overlapping_bookings:
            return Response({"error": "Time slot already booked."}, status=400)

        try:
            slot = AvailabilitySlot.objects.get(
                user=user,
                date=date_obj,
                start_time__lte=start_time,
                end_time__gte=end_time,
                is_active=True,
            )
        except AvailabilitySlot.DoesNotExist:
            return Response({"error": "No matching available slot found."}, status=400)

        booking.service = service
        booking.slot = slot
        booking.customer_name = customer_name
        booking.customer_email = customer_email
        booking.customer_phone = customer_phone
        booking.start_time = start_time
        booking.end_time = end_time
        booking.email_sent = email_sent
        booking.status = booking_status
        booking.save()

        if should_send_email:
            send_appointment_email.delay(
                customer_name=customer_name,
                service_name=service.name,
                appointment_date=date_obj,
                start_time=start_time,
                end_time=end_time,
                customer_email=customer_email,
            )

        return Response(status=200)

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)


class DashboardAPIView(APIView):
    def get(self, request, *args, **kwargs):
        last_services = Service.objects.filter(user=request.user).order_by(
            "-created_at"
        )[:3]
        last_slots = AvailabilitySlot.objects.filter(user=request.user).order_by(
            "-date"
        )[:3]
        last_bookings = Booking.objects.filter(user=request.user).order_by(
            "-end_datetime"
        )[:3]
        services = ServiceSerializer(last_services, many=True)
        slots = AvailabilitySlotSerializer(last_slots, many=True)
        bookings = BookingClientSerializer(last_bookings, many=True)
        user = UserSerializer(self.request.user)

        return Response(
            {
                "User": user.data,
                "Services": services.data,
                "Slots": slots.data,
                "Bookings": bookings.data,
            }
        )

    def put(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)


class AvailableTimesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_slug, date, service_id=None):
        user = get_user_model().objects.get(user_slug=user_slug)
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()

        service_id = service_id or request.GET.get("service_id")

        if service_id is not None:
            service = Service.objects.get(id=service_id)
            duration = service.duration
        else:
            duration = timedelta(minutes=60)

        available = generate_available_times(user, date_obj, duration)
        return Response(available)


class BookTimeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, user_slug, service_id, date, *args, **kwargs):
        serializer = BookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = get_user_model().objects.get(user_slug=user_slug)
            service = get_object_or_404(Service, id=service_id)
            date_obj = datetime.strptime(date, "%Y-%m-%d").date()

            status = serializer.validated_data["status"]
            start_time = serializer.validated_data["start_time"]
            customer_name = serializer.validated_data["customer_name"]
            customer_email = serializer.validated_data["customer_email"]
            customer_phone = serializer.validated_data["customer_phone"]

            start_dt = datetime.combine(date_obj, start_time)
            end_dt = start_dt + service.duration
            end_time = end_dt.time()

            overlapping_bookings = Booking.objects.select_for_update().filter(
                user=user,
                start_time__lt=end_time,
                end_time__gt=start_time,
                slot__date=date_obj,
            )

            if overlapping_bookings.exists():
                return Response({"error": "Time slot already booked."}, status=400)

            try:
                slot = AvailabilitySlot.objects.select_for_update().get(
                    user=user,
                    date=date_obj,
                    start_time__lte=start_time,
                    end_time__gte=end_time,
                    is_active=True,
                )
            except AvailabilitySlot.DoesNotExist:
                return Response(
                    {"error": "No matching available slot found."}, status=400
                )

            # Create booking
            booking = Booking.objects.create(
                user=user,
                service=service,
                slot=slot,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                start_time=start_time,
                end_time=end_time,
                email_sent=True,
            )

            create_verification_link(email=customer_email, booking=booking)

        return Response({"message": "Confirmation link was sent!"}, status=200)


class VerifyBookTimeAPIView(APIView):
    def get(self, request, *args, **kwargs):
        token_str = self.kwargs.get("token")
        if not token_str:
            raise ValueError("Token must be set in parameters!")

        try:
            token = uuid.UUID(token_str)
        except ValueError:
            return Response(
                {"error": "Invalid token format!"}, status=status.HTTP_400_BAD_REQUEST
            )

        verification_link = get_object_or_404(VerificationLink, token=token)

        if verification_link.is_expired():
            return Response(
                {"error": "Link has expired"}, status=status.HTTP_400_BAD_REQUEST
            )

        if verification_link.verified == True:
            return Response(
                {"error": "Booking is already confirmed!"}, status=status.HTTP_200_OK
            )

        with transaction.atomic():
            booking = (
                Booking.objects.select_for_update()
                .select_related("slot", "service")
                .get(id=verification_link.booking_id)
            )

            if booking.status == "confirmed":
                return Response(
                    {"message": "Booking has been successfully confirmed!"},
                    status=status.HTTP_200_OK,
                )

            booking.status = "confirmed"
            booking.save()

            verification_link.verified = False
            verification_link.save()

            send_appointment_email.delay(
                customer_name=booking.customer_name,
                service_name=booking.service.name,
                appointment_date=booking.slot.date,
                start_time=booking.start_time,
                end_time=booking.end_time,
                customer_email=booking.customer_email,
            )

        return Response(
            {"message": "Booking has been successfully confirmed!"},
            status=status.HTTP_200_OK,
        )


class ServicesListAPIView(generics.ListAPIView):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        user_slug = self.kwargs["user_slug"]
        queryset = Service.objects.select_related("user").filter(
            user__user_slug=user_slug
        )
        if not queryset.exists():
            raise NotFound("No services found for this user.")
        return queryset
