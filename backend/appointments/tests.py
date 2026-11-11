from datetime import date, time, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import RoleChoices
from patients.models import PatientProfile
from doctors.models import Department, DoctorProfile, DoctorAvailability
from appointments.models import Appointment, AppointmentStatus

User = get_user_model()

class AppointmentWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Department & Doctor
        self.dept = Department.objects.create(name='Pediatrics')
        self.doc_user = User.objects.create_user(
            username='dr.pediatrician',
            password='DocPassword123!',
            role=RoleChoices.DOCTOR,
            first_name='Benjamin',
            last_name='Spock'
        )
        self.doctor = DoctorProfile.objects.create(
            user=self.doc_user,
            department=self.dept,
            specialization='Pediatrics'
        )

        # Patients 1 and 2
        self.pat1_user = User.objects.create_user(
            username='patient1', password='PatPassword123!', role=RoleChoices.PATIENT
        )
        self.patient1 = PatientProfile.objects.create(
            user=self.pat1_user, first_name='Alice', last_name='Liddell', phone='1112223333'
        )

        self.pat2_user = User.objects.create_user(
            username='patient2', password='PatPassword123!', role=RoleChoices.PATIENT
        )
        self.patient2 = PatientProfile.objects.create(
            user=self.pat2_user, first_name='Bob', last_name='Cratchit', phone='4445556666'
        )

        # Receptionist
        self.receptionist = User.objects.create_user(
            username='recept_user', password='RecPassword123!', role=RoleChoices.RECEPTIONIST
        )

    def test_appointment_booking_and_double_booking_prevention(self):
        """Second booking on the exact same doctor/slot must be rejected."""
        target_date = date.today() + timedelta(days=1)

        # Patient 1 logs in and books 10:00 - 10:30
        self.client.force_authenticate(user=self.pat1_user)
        payload1 = {
            'doctor': self.doctor.id,
            'appointment_date': target_date.strftime('%Y-%m-%d'),
            'start_time': '10:00:00',
            'end_time': '10:30:00',
            'reason_for_visit': 'General health check'
        }
        res1 = self.client.post('/api/appointments/', payload1, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['patient'], self.patient1.id)

        # Patient 2 attempts to book the overlapping slot
        self.client.force_authenticate(user=self.pat2_user)
        payload2 = {
            'doctor': self.doctor.id,
            'appointment_date': target_date.strftime('%Y-%m-%d'),
            'start_time': '10:15:00', # Overlaps 10:00 - 10:30
            'end_time': '10:45:00',
            'reason_for_visit': 'Checkup'
        }
        res2 = self.client.post('/api/appointments/', payload2, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('start_time', res2.data)

    def test_patient_cannot_view_or_cancel_another_patients_appointment(self):
        """Patient 2 must be forbidden from accessing or cancelling Patient 1's appointment."""
        apt = Appointment.objects.create(
            patient=self.patient1,
            doctor=self.doctor,
            department=self.dept,
            appointment_date=date.today() + timedelta(days=2),
            start_time=time(14, 0),
            end_time=time(14, 30),
            created_by=self.pat1_user,
            status=AppointmentStatus.BOOKED
        )

        self.client.force_authenticate(user=self.pat2_user)

        # GET detail returns 403 Forbidden
        detail_res = self.client.get(f'/api/appointments/{apt.id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_403_FORBIDDEN)

        # POST cancel returns 403 Forbidden
        cancel_res = self.client.post(f'/api/appointments/{apt.id}/cancel/', {'reason': 'Malicious cancel'})
        self.assertEqual(cancel_res.status_code, status.HTTP_403_FORBIDDEN)

        # Appointment status remains unchanged
        apt.refresh_from_db()
        self.assertEqual(apt.status, AppointmentStatus.BOOKED)

    def test_receptionist_can_check_in_patient(self):
        """Receptionist checks in patient upon clinic arrival."""
        apt = Appointment.objects.create(
            patient=self.patient1,
            doctor=self.doctor,
            department=self.dept,
            appointment_date=date.today(),
            start_time=time(11, 0),
            end_time=time(11, 30),
            status=AppointmentStatus.BOOKED
        )

        self.client.force_authenticate(user=self.receptionist)
        res = self.client.post(f'/api/appointments/{apt.id}/check-in/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        apt.refresh_from_db()
        self.assertEqual(apt.status, AppointmentStatus.CHECKED_IN)
        self.assertTrue(apt.status_history.filter(new_status='CHECKED_IN').exists())
