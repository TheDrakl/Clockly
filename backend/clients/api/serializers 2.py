from rest_framework import serializers
from ..models import Service, AvailabilitySlot, Booking
from core.utils.enums import Weekday

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

class BulkAvailabilitySlotSerializer(serializers.Serializer):
    day_of_week = serializers.ListField(child=serializers.ChoiceField(choices=Weekday.choices))
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    service_id = serializers.CharField()