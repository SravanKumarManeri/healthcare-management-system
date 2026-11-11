from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import RoleChoices
from patients.models import PatientProfile

User = get_user_model()

class AccountsAuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_patient_self_registration_creates_patient_role_only(self):
        """Ensure public registration forces PATIENT role even if an attacker attempts to pass ADMIN."""
        payload = {
            'username': 'attacker',
            'email': 'attacker@example.com',
            'password': 'StrongPassword123!',
            'first_name': 'Bad',
            'last_name': 'Actor',
            'role': 'ADMIN', # Privilege escalation attempt
            'phone': '1234567890',
            'date_of_birth': '1990-01-01',
            'address': '123 Test St'
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username='attacker')
        self.assertEqual(user.role, RoleChoices.PATIENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

        # Ensure linked PatientProfile was automatically created
        self.assertTrue(PatientProfile.objects.filter(user=user).exists())
        profile = user.patient_profile
        self.assertTrue(profile.patient_number.startswith('PAT-'))

    def test_jwt_login_and_protected_me_endpoint(self):
        """Verify JWT token acquisition and authenticated profile retrieval."""
        user = User.objects.create_user(
            username='testpatient',
            email='patient@test.com',
            password='PatientPassword123!',
            role=RoleChoices.PATIENT
        )
        login_res = self.client.post('/api/auth/token/', {
            'username': 'testpatient',
            'password': 'PatientPassword123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data['access']

        # Unauthenticated request fails
        me_unauth = self.client.get('/api/auth/me/')
        self.assertEqual(me_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated request succeeds
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_auth = self.client.get('/api/auth/me/')
        self.assertEqual(me_auth.status_code, status.HTTP_200_OK)
        self.assertEqual(me_auth.data['username'], 'testpatient')
        self.assertEqual(me_auth.data['role'], 'PATIENT')

    def test_inactive_account_cannot_authenticate(self):
        """Deactivated accounts must be rejected by JWT authentication."""
        user = User.objects.create_user(
            username='disableduser',
            password='UserPass123!',
            is_active=False
        )
        res = self.client.post('/api/auth/token/', {
            'username': 'disableduser',
            'password': 'UserPass123!'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
