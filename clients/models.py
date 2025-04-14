from django.db import models
from backend.settings import AUTH_USER_MODEL

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
    is_booked = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ('user', 'date', 'start_time', 'end_time')
    
    def __str__(self):
        return f'{self.user.email}: {self.date} {self.start_time} - {self.end_time}'


class Booking(models.Model):
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    slot = models.ForeignKey(AvailabilitySlot, on_delete=models.CASCADE)

    customer_name = models.CharField(max_length=50)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)

    cretaed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed = models.BooleanField(default=True)
    
    def __str__(self):
        return f'Booking for {self.service.name} with {self.user.email} at {self.slot}'