from django.contrib import admin
from .models import CustomUser, VerificationCode

admin.site.register(CustomUser)
admin.site.register(VerificationCode)