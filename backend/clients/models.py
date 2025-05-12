from django.db import models
from backend.settings import AUTH_USER_MODEL
from datetime import datetime
from django.utils import timezone

class Service(models.Model):
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=50)
    description = models.TextField()
    duration = models.DurationField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    featured_img = models.ImageField(upload_to="services/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name} - {self.user.email}'


class AvailabilitySlot(models.Model):
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ('user', 'date', 'start_time', 'end_time')
    
    def __str__(self):
        return f'{self.user.email}: {self.date} {self.start_time} - {self.end_time}'
    

class UnavailableSlot(models.Model):
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='unavailable_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']


class Booking(models.Model):

    STATUSES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled')
    ]

    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    slot = models.ForeignKey(AvailabilitySlot, on_delete=models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()
    end_datetime = models.DateTimeField(blank=True, null=True, editable=False)
    
    customer_name = models.CharField(max_length=50)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)

    note = models.TextField(blank=True, null=True)
    status = models.CharField(choices=STATUSES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed = models.BooleanField(default=True)
    email_sent = models.BooleanField(default=False)
    was_reminded = models.BooleanField(default=False)

    def start_datetime(self):
        combined = datetime.combine(self.slot.date, self.start_time)
        return timezone.make_aware(combined)
    
    def computed_end_datetime(self):
        combined = datetime.combine(self.slot.date, self.end_time)
        return timezone.make_aware(combined)
    
    def save(self, *args, **kwargs):
        if self.slot and self.end_time:
            self.end_datetime = self.computed_end_datetime()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Booking for {self.service.name} at {self.start_time} on {self.slot.date}'
