import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from clients.models import Booking

class VerificationLink(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=30)

    def __str__(self):
        return f"Verification link for {self.email}"