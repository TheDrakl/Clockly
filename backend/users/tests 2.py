from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core import mail
from users.models import VerificationCode

class UserTests(APITestCase):

    def setUp(self):
        self.email = "denysmelnyk262626@gmail.com"
        self.username = "Denys7906"
        self.password = "StrongPassword123!"

        # Register the user
        register_url = reverse('register')
        data = {
            "email": self.email,
            "username": self.username,
            "password": self.password,
            "password2": self.password,
        }
        self.client.post(register_url, data, format='json')

        # Verify the user
        verify_url = reverse('verify-code')
        code = VerificationCode.objects.get(email=self.email).code
        verify_data = {
            "email": self.email,
            "username": self.username,
            "password": self.password,
            "password2": self.password,
            "verification_code": code
        }
        verify_response = self.client.post(verify_url, verify_data, format='json')

        self.refresh_token = verify_response.data['refresh_token']
        self.access_token = verify_response.data['access_token']

        # Login
        login_url = reverse('login')
        login_data = {
            "email": self.email,
            "password": self.password
        }
        self.login_response = self.client.post(login_url, login_data, format='json')

    def test_create_user(self):
        self.assertEqual(len(mail.outbox), 2)

    def test_verification_code(self):
        User = get_user_model()
        self.assertTrue(User.objects.filter(email=self.email).exists())
        
        self.assertIsNotNone(self.access_token)
        self.assertIsNotNone(self.refresh_token)

    def test_login(self):
        login_response = self.login_response
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', login_response.data)
        self.assertIn('refresh_token', login_response.data)


    def test_refresh_token(self):
        url = reverse('token-refresh')
        data = {
            "refresh": self.refresh_token
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    