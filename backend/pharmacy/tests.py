from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import RoleChoices
from patients.models import PatientProfile
from doctors.models import Department, DoctorProfile
from pharmacy.models import (
    Medicine,
    MedicineBatch,
    Prescription,
    PrescriptionItem,
    PrescriptionStatus,
    StockMovement,
    MovementType
)

User = get_user_model()

class PharmacyDispensingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.pharmacist = User.objects.create_user(
            username='pharm_test', password='PharmPass123!', role=RoleChoices.PHARMACIST
        )
        self.doc_user = User.objects.create_user(
            username='dr.rx', password='DocPass123!', role=RoleChoices.DOCTOR
        )
        dept = Department.objects.create(name='General')
        self.doctor = DoctorProfile.objects.create(user=self.doc_user, department=dept, specialization='General')

        self.patient_user = User.objects.create_user(
            username='rx_patient', password='PatientPass123!', role=RoleChoices.PATIENT
        )
        self.patient = PatientProfile.objects.create(user=self.patient_user, first_name='Tom', last_name='Sawyer', phone='9998887777')

        # Medicine
        self.medicine = Medicine.objects.create(
            name='Paracetamol 500mg',
            sku='MED-PCM-TEST',
            strength='500mg',
            unit='Tablet',
            reorder_level=20
        )

        # Batch 1 (expires in 60 days, 20 units)
        self.batch_near = MedicineBatch.objects.create(
            medicine=self.medicine,
            batch_number='BCH-EARLY',
            expiry_date=date.today() + timedelta(days=60),
            quantity_received=20,
            available_quantity=20
        )
        # Batch 2 (expires in 180 days, 50 units)
        self.batch_later = MedicineBatch.objects.create(
            medicine=self.medicine,
            batch_number='BCH-LATER',
            expiry_date=date.today() + timedelta(days=180),
            quantity_received=50,
            available_quantity=50
        )

    def test_fefo_dispensing_and_stock_deduction(self):
        """Prescription dispensing must use FEFO (earliest expiry first) and reduce batch stock."""
        # Create prescription for 25 tablets
        rx = Prescription.objects.create(patient=self.patient, doctor=self.doctor, status=PrescriptionStatus.ISSUED)
        item = PrescriptionItem.objects.create(
            prescription=rx,
            medicine=self.medicine,
            dosage_instructions='1 TDS',
            frequency='TDS',
            duration='8 days',
            quantity=25
        )

        self.client.force_authenticate(user=self.pharmacist)
        res = self.client.post(f'/api/pharmacy/prescriptions/{rx.id}/dispense/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Refresh batches from DB
        self.batch_near.refresh_from_db()
        self.batch_later.refresh_from_db()
        rx.refresh_from_db()
        item.refresh_from_db()

        # Batch early should be fully depleted (20 - 20 = 0)
        self.assertEqual(self.batch_near.available_quantity, 0)
        # Batch later should have provided remaining 5 units (50 - 5 = 45)
        self.assertEqual(self.batch_later.available_quantity, 45)

        # Prescription and item status
        self.assertEqual(item.dispensed_quantity, 25)
        self.assertEqual(rx.status, PrescriptionStatus.DISPENSED)

        # StockMovement records created
        movements = StockMovement.objects.filter(medicine=self.medicine, movement_type=MovementType.DISPENSED)
        self.assertEqual(movements.count(), 2)

    def test_expired_batches_are_never_dispensed(self):
        """Batches with past expiry date must not be dispensed."""
        # Create expired batch
        MedicineBatch.objects.create(
            medicine=self.medicine,
            batch_number='BCH-EXPIRED',
            expiry_date=date.today() - timedelta(days=5),
            quantity_received=100,
            available_quantity=100
        )
        # Deplete the non-expired batches
        self.batch_near.available_quantity = 0
        self.batch_near.save()
        self.batch_later.available_quantity = 0
        self.batch_later.save()

        rx = Prescription.objects.create(patient=self.patient, doctor=self.doctor, status=PrescriptionStatus.ISSUED)
        PrescriptionItem.objects.create(
            prescription=rx, medicine=self.medicine, dosage_instructions='1 daily',
            frequency='OD', duration='5 days', quantity=10
        )

        self.client.force_authenticate(user=self.pharmacist)
        res = self.client.post(f'/api/pharmacy/prescriptions/{rx.id}/dispense/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Insufficient non-expired stock', res.data['detail'])

    def test_negative_stock_adjustment_is_prevented(self):
        """Stock adjustment that would cause negative inventory must be rejected."""
        self.client.force_authenticate(user=self.pharmacist)
        payload = {
            'medicine_id': self.medicine.id,
            'batch_id': self.batch_near.id,
            'quantity_delta': -50, # Batch only has 20 units
            'reason': 'Accidental breakage'
        }
        res = self.client.post('/api/pharmacy/stock/adjust/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.batch_near.refresh_from_db()
        self.assertEqual(self.batch_near.available_quantity, 20)
