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
    