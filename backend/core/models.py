import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta, datetime
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
)
from backend.settings import AUTH_USER_MODEL
from django.utils import timezone
from django.utils.text import slugify


# Users
class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email!")
        if not username:
            raise ValueError("Users must have a username!")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, unique=False)
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    user_slug = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} - {self.username}"

    def save(self, *args, **kwargs):
        if not self.user_slug:
            base_slug = slugify(self.username)
            slug = base_slug
            counter = 1
            while CustomUser.objects.filter(user_slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.user_slug = slug
        super().save(*args, **kwargs)


# Clients
class Service(models.Model):
    user = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="services"
    )
    name = models.CharField(max_length=50)
    description = models.TextField()
    duration = models.DurationField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    featured_img = models.ImageField(upload_to="services/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.user.email}"


class AvailabilitySlot(models.Model):
    user = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="slots"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "start_time"]
        unique_together = ("user", "date", "start_time", "end_time")

    def __str__(self):
        return f"{self.user.email}: {self.date} {self.start_time} - {self.end_time}"


class UnavailableSlot(models.Model):
    user = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="unavailable_slots"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "start_time"]


class Booking(models.Model):

    STATUSES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings"
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    slot = models.ForeignKey(AvailabilitySlot, on_delete=models.CASCADE)
    start_time = models.TimeField()
    end_time = models.TimeField()
    end_datetime = models.DateTimeField(blank=True, null=True, editable=False)

    customer_name = models.CharField(max_length=50)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)

    note = models.TextField(blank=True, null=True)
    status = models.CharField(choices=STATUSES, default="pending")

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
        return (
            f"Booking for {self.service.name} at {self.start_time} on {self.slot.date}"
        )


class VerificationCode(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    expiration_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.expiration_date

    def can_resend(self):
        time_limit = timezone.now() - timedelta(minutes=5)
        return self.created_at < time_limit

    def __str__(self):
        return f"Verification Code for - {self.email}"


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


class ChatSession(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Chat Session for {self.id} - {self.user.username}'
    

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=[("user", "User"), ("bot", "Bot")])
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    


class MyDocument(models.Model):
    source = models.CharField(max_length=512)
    content = models.TextField()
    embedding = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.source} ({len(self.content)} chars)"