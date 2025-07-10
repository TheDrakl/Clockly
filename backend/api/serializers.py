from rest_framework import serializers
from core.models import CustomUser
from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from core.models import Service, AvailabilitySlot, Booking, ChatMessage, ChatSession
from core.utils.enums import Weekday

User = get_user_model()


class LoginSerializer(serializers.Serializer): 
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            request=self.context.get('request'),
            email=data['email'],
            password=data['password']
        )

        if user is None:
            raise serializers.ValidationError("Invalid login or password!")
        
        data['user'] = user
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField()
    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'username', 'password2']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        password = data['password']
        if password != data['password2']:
            raise serializers.ValidationError('Passwords must match!')
        return data
    
    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            username=validated_data['username'],
            is_active=False
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    

class VerifyCodeSerializer(serializers.Serializer):
    verification_code = serializers.CharField()
    email = serializers.CharField()


class ResendCodeSerializer(serializers.Serializer):
    email = serializers.CharField()





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
        fields = ['id', 'email', 'username', 'phone', 'user_slug']
        read_only_fields =  ['id', 'email', 'username', 'phone']

class BulkAvailabilitySlotSerializer(serializers.Serializer):
    day_of_week = serializers.ListField(child=serializers.ChoiceField(choices=Weekday.choices))
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    service_id = serializers.CharField()



class BookingSerializer(serializers.Serializer):
    status = serializers.CharField()
    start_time = serializers.TimeField()
    customer_name = serializers.CharField()
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20, required=False)


class ChatSessionsSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    class Meta:
        model = ChatSession
        fields = ["id", "started_at", "last_message"]

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return last_msg.message
        return None
    

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "message", "sender"]


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=365)
