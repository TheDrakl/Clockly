from rest_framework import serializers
from ..models import Service, AvailabilitySlot, Booking
from core.utils.enums import Weekday
from users.models import CustomUser

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

class BookingClientSerializer(serializers.ModelSerializer):
    date = serializers.DateField(write_only=True)
    service_id = serializers.CharField()
    service_name = serializers.CharField(source='service.name', read_only=True)
    email_sent = serializers.BooleanField(default=False, required=False)

    class Meta:
        model = Booking
        fields = ['id', 'customer_email', 'customer_name', 'customer_phone', 'user', 'service_id', 'start_time', 'date', 'end_datetime', 'end_time', 'email_sent', 'service_name', 'status']
        read_only_fields = ['user', 'end_time']

    def get_date(self, obj):
        return obj.slot.date if obj.slot else None
    
class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'phone']
        read_only_fields =  ['id', 'email', 'username', 'phone']

class BulkAvailabilitySlotSerializer(serializers.Serializer):
    day_of_week = serializers.ListField(child=serializers.ChoiceField(choices=Weekday.choices))
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    service_id = serializers.CharField()