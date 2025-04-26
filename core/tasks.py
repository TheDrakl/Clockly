from celery import shared_task
from django.core.mail import EmailMessage, send_mail
from django.conf import settings
from ics import Calendar, Event
from io import BytesIO
from users.models import VerificationCode
from django.utils import timezone
from datetime import datetime

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
    # try:
    #     email.send(fail_silently=False)
    # except Exception as e:
    #     logger.error(f"Failed to send appointment email to {customer_email}: {str(e)}")
    #     raise

def format_code(code):
    return ' '.join([code[i:i+3] for i in range(0, len(code), 3)])

@shared_task
def send_registration_code(user_email, security_code):
    code = format_code(security_code)
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

@shared_task
def delete_expired_codes():
    VerificationCode.objects.filter(expiration_date__lt=timezone.now()).delete()