from datetime import date, time, timedelta, datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from accounts.models import RoleChoices
from patients.models import PatientProfile
from doctors.models import Department, DoctorProfile, DoctorAvailability, WeekdayChoices
from appointments.models import Appointment, AppointmentStatus, AppointmentStatusHistory
from consultations.models import Consultation, ConsultationStatus
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

class Command(BaseCommand):
    help = 'Populates the database with realistic demonstration and test data across all HMS roles.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding Healthcare Management System demo data..."))

        with transaction.atomic():
            # 1. Create System Administrator
            admin_user, created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@clinic-demo.local',
                    'first_name': 'Eleanor',
                    'last_name': 'Vance',
                    'role': RoleChoices.ADMIN,
                    'phone': '+1-555-0100',
                    'is_staff': True,
                    'is_superuser': True
                }
            )
            admin_user.set_password('AdminPass123!')
            admin_user.save()

            # 2. Create Departments
            depts_data = [
                ('Cardiology', 'Specialized cardiovascular diagnostics, ECG, echocardiography, and hypertension clinics.'),
                ('Pediatrics', 'Comprehensive infant, child, and adolescent healthcare and developmental tracking.'),
                ('General Medicine', 'Primary care, adult preventative health, acute illness, and chronic condition management.'),
                ('Neurology', 'Diagnosis and outpatient management of neurological disorders and headaches.'),
                ('Orthopedics', 'Musculoskeletal injury treatment, joint pain management, and sports rehabilitation.')
            ]
            departments = {}
            for name, desc in depts_data:
                dept, _ = Department.objects.get_or_create(
                    name=name,
                    defaults={'description': desc, 'is_active': True}
                )
                departments[name] = dept

            # 3. Create Doctors
            doctors_spec = [
                ('dr.smith', 'Sarah', 'Smith', 'Cardiology', 'MD, FACC, Interventional Cardiology', 14, 120.00, '+1-555-0201'),
                ('dr.jones', 'Marcus', 'Jones', 'Pediatrics', 'MD, FAAP, General Pediatrics', 9, 85.00, '+1-555-0202'),
                ('dr.patel', 'Aria', 'Patel', 'General Medicine', 'MBBS, MRCGP, Primary Care Medicine', 11, 70.00, '+1-555-0203'),
            ]
            doctors = {}
            for username, fname, lname, dept_name, quals, exp, fee, phone in doctors_spec:
                u, _ = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'email': f'{username}@clinic-demo.local',
                        'first_name': fname,
                        'last_name': lname,
                        'role': RoleChoices.DOCTOR,
                        'phone': phone,
                        'is_staff': True
                    }
                )
                u.set_password('DoctorPass123!')
                u.save()

                doc_prof, _ = DoctorProfile.objects.get_or_create(
                    user=u,
                    defaults={
                        'department': departments[dept_name],
                        'specialization': dept_name,
                        'qualifications': quals,
                        'experience_years': exp,
                        'consultation_fee': fee,
                        'phone': phone,
                        'bio': f'Board-certified specialist in {dept_name} with {exp} years of clinical experience.',
                        'is_available': True
                    }
                )
                doctors[username] = doc_prof

                # Create working hours: Mon - Fri, 09:00 - 17:00 (30 min slots)
                for day in [WeekdayChoices.MONDAY, WeekdayChoices.TUESDAY, WeekdayChoices.WEDNESDAY, WeekdayChoices.THURSDAY, WeekdayChoices.FRIDAY]:
                    DoctorAvailability.objects.get_or_create(
                        doctor=doc_prof,
                        weekday=day,
                        defaults={
                            'start_time': time(9, 0),
                            'end_time': time(17, 0),
                            'slot_duration_minutes': 30,
                            'active': True
                        }
                    )

            # 4. Create Receptionist
            receptionist_user, _ = User.objects.get_or_create(
                username='receptionist1',
                defaults={
                    'email': 'reception@clinic-demo.local',
                    'first_name': 'Clara',
                    'last_name': 'Oswald',
                    'role': RoleChoices.RECEPTIONIST,
                    'phone': '+1-555-0301',
                    'is_staff': False
                }
            )
            receptionist_user.set_password('ReceptionPass123!')
            receptionist_user.save()

            # 5. Create Pharmacist
            pharmacist_user, _ = User.objects.get_or_create(
                username='pharmacist1',
                defaults={
                    'email': 'pharmacy@clinic-demo.local',
                    'first_name': 'Walter',
                    'last_name': 'Bishop',
                    'role': RoleChoices.PHARMACIST,
                    'phone': '+1-555-0401',
                    'is_staff': False
                }
            )
            pharmacist_user.set_password('PharmacyPass123!')
            pharmacist_user.save()

            # 6. Create Patients (with user login and without)
            patient_users_spec = [
                ('john.doe', 'John', 'Doe', date(1988, 5, 14), 'MALE', '+1-555-0501', '742 Evergreen Terrace, Springfield', 'Mary Doe', '+1-555-0502', 'O+'),
                ('jane.roe', 'Jane', 'Roe', date(1994, 9, 22), 'FEMALE', '+1-555-0503', '10880 Wilshire Blvd, Los Angeles', 'Richard Roe', '+1-555-0504', 'A+'),
            ]
            patients = {}
            for username, fname, lname, dob, gender, phone, addr, e_name, e_phone, bgroup in patient_users_spec:
                pu, _ = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'email': f'{username}@example.com',
                        'first_name': fname,
                        'last_name': lname,
                        'role': RoleChoices.PATIENT,
                        'phone': phone
                    }
                )
                pu.set_password('PatientPass123!')
                pu.save()

                p_prof, _ = PatientProfile.objects.get_or_create(
                    user=pu,
                    defaults={
                        'first_name': fname,
                        'last_name': lname,
                        'date_of_birth': dob,
                        'gender': gender,
                        'phone': phone,
                        'email': pu.email,
                        'address': addr,
                        'emergency_contact_name': e_name,
                        'emergency_contact_phone': e_phone,
                        'blood_group': bgroup,
                        'administrative_notes': 'Demo patient account for test bookings.'
                    }
                )
                patients[username] = p_prof

            # Walk-in patient without user portal account
            walkin_patient, _ = PatientProfile.objects.get_or_create(
                first_name='Robert',
                last_name='Langdon',
                phone='+1-555-0999',
                defaults={
                    'date_of_birth': date(1975, 6, 22),
                    'gender': 'MALE',
                    'email': 'robert.langdon@demo.org',
                    'address': 'Harvard Yard, Cambridge MA',
                    'blood_group': 'B+',
                    'administrative_notes': 'Walk-in emergency room triage.'
                }
            )
            patients['walkin'] = walkin_patient

            # 7. Create Medicines and Batches
            meds_data = [
                ('Amoxicillin 500mg', 'Amoxicillin', '500 mg', 'CAPSULE', 'PharmaCorp', 'MED-AMX-500', 'Capsule', 30, 200, date(2027, 8, 1)),
                ('Paracetamol 500mg', 'Acetaminophen', '500 mg', 'TABLET', 'HealthMed', 'MED-PCM-500', 'Tablet', 50, 400, date(2027, 12, 1)),
                ('Atorvastatin 20mg', 'Atorvastatin Calcium', '20 mg', 'TABLET', 'CardioHealth', 'MED-ATV-020', 'Tablet', 25, 120, date(2027, 5, 15)),
                ('Cetirizine 10mg', 'Cetirizine HCl', '10 mg', 'TABLET', 'AllergyFree', 'MED-CTZ-010', 'Tablet', 20, 80, date(2027, 11, 20)),
                ('Metformin 500mg', 'Metformin HCl', '500 mg', 'TABLET', 'EndoPharma', 'MED-MET-500', 'Tablet', 40, 150, date(2027, 9, 30)),
                ('Ibuprofen 400mg (Low Stock)', 'Ibuprofen', '400 mg', 'TABLET', 'PainRelief Inc', 'MED-IBU-400', 'Tablet', 25, 8, date(2027, 4, 10)),
            ]
            medicines = {}
            for name, generic, strength, form, mfg, sku, unit, reorder, initial_qty, exp in meds_data:
                med, _ = Medicine.objects.get_or_create(
                    sku=sku,
                    defaults={
                        'name': name,
                        'generic_name': generic,
                        'strength': strength,
                        'dosage_form': form,
                        'manufacturer': mfg,
                        'unit': unit,
                        'reorder_level': reorder,
                        'is_active': True
                    }
                )
                medicines[sku] = med

                batch, b_created = MedicineBatch.objects.get_or_create(
                    medicine=med,
                    batch_number=f"BCH-{sku[-3:]}-2026",
                    defaults={
                        'expiry_date': exp,
                        'quantity_received': initial_qty,
                        'available_quantity': initial_qty
                    }
                )
                if b_created:
                    StockMovement.objects.create(
                        medicine=med,
                        batch=batch,
                        movement_type=MovementType.RECEIVED,
                        quantity_delta=initial_qty,
                        reason="Initial pharmacy inventory load",
                        reference="PO-INITIAL-001",
                        performed_by=pharmacist_user
                    )

            # 8. Appointments & Clinical Consultations for Demo
            today = date.today()

            # Past completed appointment with consultation & prescription
            apt_past, _ = Appointment.objects.get_or_create(
                patient=patients['john.doe'],
                doctor=doctors['dr.patel'],
                appointment_date=today - timedelta(days=2),
                start_time=time(10, 0),
                defaults={
                    'end_time': time(10, 30),
                    'department': doctors['dr.patel'].department,
                    'reason_for_visit': 'Persistent cough and mild seasonal fatigue.',
                    'status': AppointmentStatus.COMPLETED,
                    'created_by': patients['john.doe'].user
                }
            )

            # Create consultation
            consultation_past, _ = Consultation.objects.get_or_create(
                appointment=apt_past,
                defaults={
                    'patient': patients['john.doe'],
                    'doctor': doctors['dr.patel'],
                    'symptoms_or_history': 'Patient reports 4-day history of non-productive cough, afebrile, mild throat irritation.',
                    'examination_notes': 'Oropharynx mildly erythematous. Chest clear to auscultation bilaterally. SpO2 99% on room air.',
                    'diagnosis': 'Acute viral upper respiratory tract infection (URTI). [Demo Disclaimer]',
                    'advice': 'Adequate hydration, warm saline gargles, adequate rest. Return if fever develops.',
                    'follow_up_date': today + timedelta(days=5),
                    'status': ConsultationStatus.FINAL
                }
            )

            # Create prescription
            rx_past, rx_created = Prescription.objects.get_or_create(
                patient=patients['john.doe'],
                doctor=doctors['dr.patel'],
                consultation=consultation_past,
                defaults={
                    'status': PrescriptionStatus.ISSUED,
                    'notes': 'Take medications with meals. Complete full 5-day course.'
                }
            )
            if rx_created:
                PrescriptionItem.objects.create(
                    prescription=rx_past,
                    medicine=medicines['MED-PCM-500'],
                    dosage_instructions='1 tablet after meals as needed',
                    frequency='TDS (3 times daily)',
                    duration='5 days',
                    quantity=15
                )
                PrescriptionItem.objects.create(
                    prescription=rx_past,
                    medicine=medicines['MED-CTZ-010'],
                    dosage_instructions='1 tablet at night',
                    frequency='OD (Once daily at night)',
                    duration='5 days',
                    quantity=5
                )

            # Today's appointments (Checked In and Booked)
            apt_today1, _ = Appointment.objects.get_or_create(
                patient=patients['jane.roe'],
                doctor=doctors['dr.smith'],
                appointment_date=today,
                start_time=time(9, 30),
                defaults={
                    'end_time': time(10, 0),
                    'department': doctors['dr.smith'].department,
                    'reason_for_visit': 'Routine cardiovascular checkup and blood pressure assessment.',
                    'status': AppointmentStatus.CHECKED_IN,
                    'created_by': receptionist_user
                }
            )

            apt_today2, _ = Appointment.objects.get_or_create(
                patient=patients['walkin'],
                doctor=doctors['dr.jones'],
                appointment_date=today,
                start_time=time(11, 0),
                defaults={
                    'end_time': time(11, 30),
                    'department': doctors['dr.jones'].department,
                    'reason_for_visit': 'Pediatric rash consultation.',
                    'status': AppointmentStatus.BOOKED,
                    'created_by': receptionist_user
                }
            )

            # Upcoming appointment
            Appointment.objects.get_or_create(
                patient=patients['john.doe'],
                doctor=doctors['dr.smith'],
                appointment_date=today + timedelta(days=3),
                start_time=time(14, 0),
                defaults={
                    'end_time': time(14, 30),
                    'department': doctors['dr.smith'].department,
                    'reason_for_visit': 'Cardiology follow-up consultation.',
                    'status': AppointmentStatus.CONFIRMED,
                    'created_by': patients['john.doe'].user
                }
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("""
Credentials for demonstration:
  - Administrator : admin / AdminPass123!
  - Doctor (Cardiology) : dr.smith / DoctorPass123!
  - Doctor (Pediatrics) : dr.jones / DoctorPass123!
  - Doctor (Medicine)   : dr.patel / DoctorPass123!
  - Receptionist        : receptionist1 / ReceptionPass123!
  - Pharmacist          : pharmacist1 / PharmacyPass123!
  - Patient             : john.doe / PatientPass123!
  - Patient             : jane.roe / PatientPass123!
"""))
