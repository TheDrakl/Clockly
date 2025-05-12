from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import generics
from rest_framework import status
from django.shortcuts import get_object_or_404
from .serializers import BookingSerializer, AvailabilitySlotSerializer, ServiceSerializer, BookingClientSerializer, UserSerializer
from ..models import Booking, AvailabilitySlot, Service
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from core.tasks import send_appointment_email
from datetime import datetime
import time

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
    lookup_field = 'id'    

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
    

class AvailabilitySlotRetrieveUpdateDestroyAPIVIew(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'    

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

    def post(self, request, *args, **kwargs):
        serializer = BookingClientSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = self.request.user
        service_id = serializer.validated_data['service_id']
        service = get_object_or_404(Service, id=service_id)
        date_obj = serializer.validated_data['date']
        email_sent = serializer.validated_data['email_sent']
        
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
            end_time=end_time,
            email_sent=email_sent
        )


        if email_sent:
            send_appointment_email.delay(
            customer_name=customer_name,
            service_name=service.name,
            appointment_date=date_obj,
            start_time=start_time,
            end_time=end_time,
            customer_email=customer_email
        )

        return Response({"message": "Booking confirmed!"}, status=201)


class BookingRetrieveUpdateDestroyAPIVIew(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = 'id' 

    def update(self, request, *args, **kwargs):
        serializer = BookingClientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.request.user
        service_id = serializer.validated_data['service_id']
        service = get_object_or_404(Service, id=service_id)
        date_obj = serializer.validated_data['date']
        email_sent = serializer.validated_data['email_sent']
        
        start_time = serializer.validated_data['start_time']
        customer_name = serializer.validated_data['customer_name']
        customer_email = serializer.validated_data['customer_email']
        customer_phone = serializer.validated_data['customer_phone']
        booking_status = serializer.validated_data['status']

        start_dt = datetime.combine(date_obj, start_time)
        end_dt = start_dt + service.duration
        end_time = end_dt.time()

        booking = Booking.objects.get(id=self.kwargs['id'])

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
                customer_email=customer_email
            )

        return Response(status=200)

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)


class DashboardAPIView(APIView):
    def get(self, request, *args, **kwargs):
        services = ServiceSerializer(Service.objects.filter(user=request.user), many=True)
        slots = AvailabilitySlotSerializer(AvailabilitySlot.objects.filter(user=request.user), many=True)
        bookings = BookingClientSerializer(Booking.objects.filter(user=request.user), many=True)
        user = UserSerializer(self.request.user)
        
        return Response({
            "User": user.data,
            "Services": services.data,
            "Slots": slots.data,
            "Bookings": bookings.data,
        })
    