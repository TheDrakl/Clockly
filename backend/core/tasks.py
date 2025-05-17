from celery import shared_task
from django.core.mail import EmailMessage, send_mail
from django.conf import settings
from ics import Calendar, Event
from io import BytesIO
from users.models import VerificationCode
from clients.models import Booking
from django.utils import timezone
from datetime import datetime, timedelta
from django.db import transaction
import logging

logger = logging.getLogger('core')

@shared_task
def send_appointment_email(customer_name, service_name, appointment_date, start_time, end_time, customer_email):
    start_datetime = timezone.localtime(
        timezone.make_aware(
            datetime.strptime(f"{appointment_date} {start_time}", "%Y-%m-%d %H:%M:%S")
        )
    )
    end_datetime = timezone.localtime(
        timezone.make_aware(
            datetime.strptime(f"{appointment_date} {end_time}", "%Y-%m-%d %H:%M:%S")
        )
    )

    event = Event()
    event.name = f"Appointment: {service_name}"
    event.begin = start_datetime
    event.end = end_datetime
    event.location = "Your business location"
    event.description = f"Your appointment for {service_name}."

    calendar = Calendar()
    calendar.events.add(event)

    ics_file = BytesIO()
    ics_file.write(str(calendar).encode('utf-8'))
    ics_file.seek(0)

    subject = f"Your Appointment with {service_name}"
    message = f"""
    <p>Hello {customer_name},</p>

    <p>Thank you for booking your appointment with us!</p>

    <p><strong>Appointment Details:</strong></p>
    <ul>
    <li>Service: {service_name}</li>
    <li>Date: {appointment_date}</li>
    <li>Start Time: {start_time}</li>
    <li>End Time: {end_time}</li>
    </ul>

    <p>We look forward to seeing you!</p>

    <p>If you have any questions or need to reschedule, feel free to contact us.</p>

    <p>Best regards,<br>Clockly Team</p>
    """

    email = EmailMessage(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [customer_email],
    )
    email.content_subtype = 'html'
    filename = f"appointment-{customer_name.replace(' ', '_')}-{appointment_date}.ics"
    email.attach(filename, ics_file.read(), 'text/calendar')

    email.send(fail_silently=False)
    logger.info(f'Booking email was sent to {customer_email}')

def format_code(code):
    return ' '.join([code[i:i+3] for i in range(0, len(code), 3)])

@shared_task
def send_registration_code(user_email, security_code):
    code = format_code(security_code)
    logger.info("Registration code started")
    message =  f"""
        Hello,

        Thanks for registration at Clockly!

        Your registration code is: {code}

        Best regards,
        Clockly Team
    """
    send_mail(
        "Registration Code",
        message,
        settings.EMAIL_HOST_USER,
        [user_email],
        fail_silently=True,
    )
    logger.info(f'Registration code was sent to {user_email}')

@shared_task 
def send_registration_success(user_email):
    subject = "Welcome to Clockly!"
    message = f"""
    Hello,

    Your account has been successfully verified and activated 🎉

    You can now log in and start using Clockly!

    If you didn’t create this account, please contact our support team immediately.

    Best regards,  
    The Clockly Team
    """
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [user_email],
        fail_silently=True,
    )
    logger.info(f"Account was verified with verification code for {user_email}")


@shared_task
def send_booking_reminder(booking=None):
    if not booking is None:
        send_mail_reminder(booking=booking)
    send_before_time = timedelta(minutes=120)

    time_now = timezone.now()

    time_window_start = time_now
    time_window_end = time_now + send_before_time

    bookings = Booking.objects.all()

    bookings_to_remind = [
        booking for booking in bookings
        if time_window_start <= booking.start_datetime() < time_window_end and not booking.was_reminded
    ]

    count = len(bookings_to_remind)

    if not bookings_to_remind:
        logger.info("There's no bookings to remind of")
        return

    for booking in bookings_to_remind:
        with transaction.atomic():
            if not booking.was_reminded:
                booking.was_reminded = True
                booking.save()

                send_mail_reminder(booking)
    logger.info(f'{count} people received booking reminder!')

def send_mail_reminder(booking):
    subject = f"Reminder: Your booking starts soon"
    message = f"Dear {booking.user.username},\n\nYour booking for {booking.service} is starting at {booking.start_time}. Please be prepared."
    recipient_list = [booking.user.email]
    
    send_mail(subject, message, settings.EMAIL_HOST_USER, recipient_list)
    logger.info(f'Reminder sent to {recipient_list} for booking {booking.id}')


@shared_task
def delete_expired_codes():
    verification_codes_to_delete = VerificationCode.objects.filter(expiration_date__lt=timezone.now())

    if not verification_codes_to_delete:
        logging.info("There's no verification codes to delete!")
        return 
    
    verification_codes_to_delete.delete()

    logger.info("Verification codes were cleared")


@shared_task
def delete_old_bookings():
    delete_after_days = timedelta(days=30)
    time_now = timezone.now()

    datetime_before = time_now - delete_after_days

    bookings_to_delete = Booking.objects.filter(end_datetime__lt=datetime_before)

    if not bookings_to_delete:
        logger.info("There's no bookings to delete!")
        return

    count = bookings_to_delete.count()

    bookings_to_delete.delete()

    logger.info(f'{count} bookings were removed!')


@shared_task
def delete_unconfirmed_bookings():
    delete_after_minutes = timedelta(minutes=15)
    time_now = timezone.now()

    datetime_before = time_now - delete_after_minutes

    bookings_to_delete = Booking.objects.filter(created_at__lt=datetime_before, status='pending')

    if not bookings_to_delete:
        logger.info("There's no bookings to delete!")
        return

    count = bookings_to_delete.count()

    bookings_to_delete.delete()

    logger.info(f'{count} pending bookings were removed!')