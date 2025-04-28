from django.contrib import admin
from .models import Service, AvailabilitySlot, Booking, UnavailableSlot
from django.contrib import admin


class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'service', 'start_datetime', 'end_datetime', 'customer_name', 'customer_email', 'start_time', 'slot', 'created_at', 'updated_at', 'confirmed')

    def start_datetime(self, obj):
        return obj.start_datetime()
    def end_datetime(self, obj):
        return obj.end_datetime()
    start_datetime.admin_order_field = 'start_datetime' 
    start_datetime.short_description = 'Start Date & Time'

admin.site.register(Booking, BookingAdmin)

admin.site.register(Service)
admin.site.register(AvailabilitySlot)
admin.site.register(UnavailableSlot)