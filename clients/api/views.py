from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import generics
from rest_framework import status
from django.shortcuts import get_object_or_404
from .serializers import BookingSerializer, AvailabilitySlotSerializer, ServiceSerializer, BulkAvailabilitySlotSerializer
from ..models import Booking, AvailabilitySlot, Service
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from datetime import timedelta, datetime
from django.db import transaction

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


class BookingRetrieveUpdateDestroyAPIVIew(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'    

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)    


class DashboardAPIView(APIView):
    def get(self, request, *args, **kwargs):
        services = ServiceSerializer(Service.objects.filter(user=request.user), many=True)
        slots = AvailabilitySlotSerializer(AvailabilitySlot.objects.filter(user=request.user), many=True)
        bookings = BookingSerializer(Booking.objects.filter(user=request.user), many=True)
        
        return Response({
            "Services": services.data,
            "Slots": slots.data,
            "Bookings": bookings.data,
        })


class BulkAvailabilitySlotCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = BulkAvailabilitySlotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        start_time = validated_data['start_time']
        end_time = validated_data['end_time']
        service = get_object_or_404(Service, id=validated_data['service_id'])
        duration = service.duration
        user = request.user

        current_date = validated_data['start_date']
        end_date = validated_data['end_date']
        created_slots = 0


        slots_to_create = []

        while current_date <= end_date:

            if current_date.strftime('%a') in validated_data['day_of_week']:
                slot_start = datetime.combine(current_date, start_time)
                slot_end = datetime.combine(current_date, end_time)

                while slot_start + duration <= slot_end:

                    if not AvailabilitySlot.objects.filter(
                        user=user,
                        date=current_date,
                        start_time=slot_start.time(),
                        end_time=(slot_start + duration).time()
                    ).exists():
                        
                        slots_to_create.append(
                            AvailabilitySlot(
                                user=user,
                                date=current_date,
                                start_time=slot_start.time(),
                                end_time=(slot_start + duration).time()
                            )
                        )
                        created_slots += 1

                    slot_start += duration

            current_date += timedelta(days=1)

        if slots_to_create:
            with transaction.atomic(): 
                AvailabilitySlot.objects.bulk_create(slots_to_create)

        return Response({
            "message": f"{created_slots} availability slots created."
        })