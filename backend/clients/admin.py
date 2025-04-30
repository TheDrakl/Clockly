from django.contrib import admin
from django.urls import path
from django.utils.html import format_html
from django.shortcuts import redirect
from .models import Service, AvailabilitySlot, Booking, UnavailableSlot
from core.tasks import send_booking_reminder
from django.contrib import admin
from django.urls import path
from django.utils.html import format_html
from django.shortcuts import redirect
from .models import Service, AvailabilitySlot, Booking, UnavailableSlot
from django.core.mail import send_mail
from django.conf import settings

class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'service', 'start_datetime', 'end_datetime', 'customer_name', 'customer_email', 'start_time', 'slot', 'created_at', 'updated_at', 'confirmed')
    actions = ['send_reminder_action']

    def start_datetime(self, obj):
        return obj.start_datetime()

    def end_datetime(self, obj):
        return obj.end_datetime()

    start_datetime.admin_order_field = 'start_datetime'
    start_datetime.short_description = 'Start Date & Time'

    def send_reminder_action(self, request, queryset):
        for booking in queryset:
            self.message_user(request, f"Reminder sent for {booking}")
    send_reminder_action.short_description = "Send Reminder to selected bookings"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:booking_id>/send-reminder/', self.admin_site.admin_view(self.send_single_reminder), name='send-single-reminder'),
        ]
        return custom_urls + urls

    def send_single_reminder(self, request, booking_id, *args, **kwargs):
        booking = Booking.objects.get(pk=booking_id)
        send_booking_reminder(booking)
        self.message_user(request, f"Single reminder sent for booking {booking.id}")
        return redirect('admin:clients_booking_change', booking_id)

    def render_change_form(self, request, context, *args, **kwargs):
        if 'original' in context:
            booking = context['original']
            reminder_url = f'../send-reminder/'
            context['custom_button'] = format_html(
                '<a class="button" href="{}" style="margin-right: 10px;">Send Reminder</a>',
                reminder_url
            )
        return super().render_change_form(request, context, *args, **kwargs)

admin.site.register(Booking, BookingAdmin)
admin.site.register(Service)
admin.site.register(AvailabilitySlot)
admin.site.register(UnavailableSlot)