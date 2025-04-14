from django.contrib import admin
from .models import Service, AvailabilitySlot, Booking

admin.site.register(Service)
admin.site.register(AvailabilitySlot)
admin.site.register(Booking)