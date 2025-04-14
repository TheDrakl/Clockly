from rest_framework import serializers
from ..models import Service, AvailabilitySlot, Booking


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        model = Service
        read_only_fields = ['user']


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        model = AvailabilitySlot
        read_only_fields = ['user']


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        model = Booking
        read_only_fields = ['user']