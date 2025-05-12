import random
import string
from django.utils import timezone
from datetime import timedelta
from users.models import VerificationCode
from ..tasks import send_registration_code

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
    