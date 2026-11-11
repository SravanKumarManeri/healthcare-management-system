from datetime import date, time, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import RoleChoices
from doctors.models import Department, DoctorProfile, DoctorAvailability, AvailabilityException

User = get_user_model()

class DoctorAvailabilityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.dept = Department.objects.create(name='Cardiology', description='Heart care')
        self.doctor_user = User.objects.create_user(
            username='dr.test',
            email='dr.test@clinic.local',
            password='DocPass123!',
            first_name='Albert',
            last_name='Schweitzer',
            role=RoleChoices.DOCTOR
        )
        self.doctor = DoctorProfile.objects.create(
            user=self.doctor_user,
            department=self.dept,
            specialization='Cardiology',
            qualifications='MD',
            experience_years=10,
            consultation_fee=100.00,
            is_available=True
        )

    def test_availability_slots_generation(self):
        """Slots should be generated based on weekly working hours."""
        # Find next Monday
        today = date.today()
        days_ahead = (0 - today.weekday()) % 7
        if days_ahead == 0:
            days_ahead = 7
        target_monday = today + timedelta(days=days_ahead)

        # Set Monday working hours: 09:00 to 11:00 (30 min slots = 4 slots)
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            weekday=0, # Monday
            start_time=time(9, 0),
            end_time=time(11, 0),
            slot_duration_minutes=30
        )

        res = self.client.get(f'/api/doctors/{self.doctor.id}/availability/?date={target_monday}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_available'])
        self.assertEqual(len(res.data['slots']), 4)
        self.assertEqual(res.data['slots'][0]['start_time'], '09:00')
        self.assertEqual(res.data['slots'][0]['end_time'], '09:30')

    def test_all_day_leave_blocks_all_slots(self):
        """When an all-day block exception exists, the doctor is unavailable."""
        target_date = date.today() + timedelta(days=2)
        DoctorAvailability.objects.create(
            doctor=self.doctor,
            weekday=target_date.weekday(),
            start_time=time(9, 0),
            end_time=time(17, 0)
        )
        AvailabilityException.objects.create(
            doctor=self.doctor,
            date=target_date,
            is_all_day=True,
            exception_type='BLOCKED',
            reason='Conference'
        )

        res = self.client.get(f'/api/doctors/{self.doctor.id}/availability/?date={target_date}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['is_available'])
        self.assertEqual(len(res.data['slots']), 0)
