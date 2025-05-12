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
        self.verify_response = self.client.post(verify_url, verify_data, format='json')

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
        # Check cookies set
        self.assertIn('access_token', self.verify_response.cookies)
        self.assertIn('refresh_token', self.verify_response.cookies)

    def test_login(self):
        login_response = self.login_response
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        # Check cookies set
        self.assertIn('access_token', login_response.cookies)
        self.assertIn('refresh_token', login_response.cookies)

    def test_authenticated_request(self):
        # Simulate logged-in user by setting the access_token cookie
        access_token = self.login_response.cookies['access_token'].value
        self.client.cookies['access_token'] = access_token
        url = reverse('check-auth')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('is_authenticated'))

    def test_refresh_token(self):
        # Set refresh_token cookie
        refresh_token = self.login_response.cookies['refresh_token'].value
        self.client.cookies['refresh_token'] = refresh_token
        url = reverse('token-refresh')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should set new access_token and refresh_token cookies
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)