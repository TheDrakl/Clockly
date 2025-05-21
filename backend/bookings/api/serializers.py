from clients.models import Booking, AvailabilitySlot, Service
from rest_framework import serializers


class BookingSerializer(serializers.Serializer):
    status = serializers.CharField()
    start_time = serializers.TimeField()
    customer_name = serializers.CharField()
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20, required=False)