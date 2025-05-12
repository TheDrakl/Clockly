from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import generics
from rest_framework import status
from django.shortcuts import get_object_or_404
from clients.models import Booking, AvailabilitySlot, Service
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import NotFound
from clients.utils.available_times import generate_available_times
from datetime import datetime
from .serializers import BookingSerializer
from clients.api.serializers import ServiceSerializer
from datetime import timedelta
from core.tasks import send_appointment_email

class AvailableTimesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username, date, service_id=None):
        user = get_user_model().objects.get(username=username)
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()

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

    def post(self, request, username, service_id, date, *args, **kwargs):
        serializer = BookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = get_user_model().objects.get(username=username)
        service = get_object_or_404(Service, id=service_id)
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        
        start_time = serializer.validated_data['start_time']
        customer_name = serializer.validated_data['customer_name']
        customer_email = serializer.validated_data['customer_email']
        customer_phone = serializer.validated_data['customer_phone']

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
            end_time=end_time
        )

        send_appointment_email.delay(
            customer_name=customer_name,
            service_name=service.name,
            appointment_date=date_obj,
            start_time=start_time,
            end_time=end_time,
            customer_email=customer_email
        )


        return Response({"message": "Booking confirmed!"}, status=201)


class ServicesListAPIView(generics.ListAPIView):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        username = self.kwargs['username']
        queryset = Service.objects.select_related('user').filter(user__username=username)
        if not queryset.exists():
            raise NotFound("No services found for this user.")
        return queryset

