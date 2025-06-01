import random
import string
from django.utils import timezone
from datetime import timedelta
from core.models import VerificationCode
from ..tasks import send_registration_code, send_booking_verification
from core.models import VerificationLink

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))


def create_verification_code(email):
    code = generate_verification_code()
    expiration_date = timezone.now() + timedelta(minutes=10)

    verification_code = VerificationCode.objects.create(
        email=email,
        code=code,
        expiration_date=expiration_date,
    )

    send_registration_code.delay(
        user_email=email,
        security_code=code,
    )


def create_verification_link(email, booking):
    verification_link = VerificationLink.objects.create(
        email=email,
        booking=booking
    )

    link = f'http://localhost:5173/bookings/verify-booking/{verification_link.token}'

    send_booking_verification.delay(
        user_email=email,
        verification_link=link
    )