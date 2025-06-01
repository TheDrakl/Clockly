from django.contrib import admin
from .models import VerificationLink, VerificationCode, CustomUser, Service, AvailabilitySlot, UnavailableSlot, Booking

admin.site.register(VerificationLink)
admin.site.register(VerificationCode)
admin.site.register(CustomUser)
admin.site.register(Service)
admin.site.register(AvailabilitySlot)
admin.site.register(UnavailableSlot)
admin.site.register(Booking)