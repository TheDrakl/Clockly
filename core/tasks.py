from celery import shared_task
from django.core.mail import EmailMessage, send_mail
from django.conf import settings
from ics import Calendar, Event
from io import BytesIO
from users.models import VerificationCode
from django.utils import timezone

@shared_task
def send_appointment_email(customer_name, service_name, appointment_date, start_time, end_time, customer_email):
    event = Event()
    event.name = f"Appointment: {service_name}"
    event.begin = f"{appointment_date} {start_time}"
    event.end = f"{appointment_date} {end_time}"
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

    <p>Here are the details of your appointment:</p>

    Service: {service_name}
    Date: {appointment_date}
    Start Time: {start_time}
    End Time: {end_time}

    <p>We look forward to seeing you!</p>

    <p>If you have any questions or need to reschedule, feel free to contact us.</p>

    <p>Best regards, <br>Clockly Team/p>
    """

    email = EmailMessage(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [customer_email],
    )
    email.content_subtype = 'html'
    email.attach('appointment.ics', ics_file.read(), 'text/calendar')

    email.send(fail_silently=False)

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