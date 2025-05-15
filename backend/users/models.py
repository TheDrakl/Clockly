from django.db import models
from django.contrib.auth.models import (
    BaseUserManager,
    AbstractBaseUser,
    PermissionsMixin,
)
from django.utils import timezone
from datetime import timedelta
from django.utils.text import slugify


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
