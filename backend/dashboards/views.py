from datetime import date, timedelta
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from rest_framework import views, status, exceptions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdmin, IsDoctor, IsReceptionist, IsPharmacist, IsPatient
from patients.models import PatientProfile
from doctors.models import DoctorProfile, Department
from appointments.models import Appointment, AppointmentStatus
from consultations.models import Consultation
from pharmacy.models import Medicine, MedicineBatch, Prescription, PrescriptionStatus, StockMovement

from drf_spectacular.utils import extend_schema

User = get_user_model()

class AdminDashboardView(views.APIView):
    """Real-time analytics and system oversight for Administrators."""
    permission_classes = [IsAdmin]

    @extend_schema(responses={200: dict})
    def get(self, request):
        today = date.today()

        total_patients = PatientProfile.objects.count()
        total_doctors = DoctorProfile.objects.filter(is_available=True).count()
        total_staff = User.objects.filter(role__in=['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST']).count()
        total_departments = Department.objects.filter(is_active=True).count()

        today_appointments = Appointment.objects.filter(appointment_date=today)
        today_total = today_appointments.count()
        today_booked = today_appointments.filter(status=AppointmentStatus.BOOKED).count()
        today_checked_in = today_appointments.filter(status=AppointmentStatus.CHECKED_IN).count()
        today_completed = today_appointments.filter(status=AppointmentStatus.COMPLETED).count()
        today_cancelled = today_appointments.filter(status=AppointmentStatus.CANCELLED).count()

        total_all_appointments = Appointment.objects.count()

        # Low stock count
        all_medicines = Medicine.objects.prefetch_related('batches').filter(is_active=True)
        low_stock_count = sum(1 for m in all_medicines if m.is_low_stock)

        # Recent activities
        recent_appointments = Appointment.objects.select_related('patient', 'doctor').order_by('-created_at')[:5].values(
            'id', 'patient__first_name', 'patient__last_name', 'doctor__user__first_name', 'doctor__user__last_name',
            'appointment_date', 'start_time', 'status', 'created_at'
        )

        return Response({
            'metrics': {
                'total_patients': total_patients,
                'total_doctors': total_doctors,
                'total_staff': total_staff,
                'total_departments': total_departments,
                'today_appointments_total': today_total,
                'today_booked': today_booked,
                'today_checked_in': today_checked_in,
                'today_completed': today_completed,
                'today_cancelled': today_cancelled,
                'total_appointments': total_all_appointments,
                'low_stock_medicines': low_stock_count
            },
            'recent_appointments': list(recent_appointments)
        })

class DoctorDashboardView(views.APIView):
    """Clinical metrics and appointment schedule for consulting Doctors."""
    permission_classes = [IsDoctor]

    @extend_schema(responses={200: dict})
    def get(self, request):
        user = request.user
        if not hasattr(user, 'doctor_profile'):
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        doctor = user.doctor_profile
        today = date.today()

        today_apts = Appointment.objects.select_related('patient', 'department').filter(
            doctor=doctor, appointment_date=today
        ).order_by('start_time')

        upcoming_apts_count = Appointment.objects.filter(
            doctor=doctor, appointment_date__gt=today
        ).exclude(status=AppointmentStatus.CANCELLED).count()

        completed_count = Appointment.objects.filter(
            doctor=doctor, status=AppointmentStatus.COMPLETED
        ).count()

        today_apts_data = [
            {
                'id': a.id,
                'patient_name': a.patient.full_name,
                'patient_number': a.patient.patient_number,
                'start_time': a.start_time.strftime('%H:%M'),
                'end_time': a.end_time.strftime('%H:%M'),
                'reason_for_visit': a.reason_for_visit,
                'status': a.status,
                'has_consultation': hasattr(a, 'consultation')
            }
            for a in today_apts
        ]

        # Total unique patients treated
        unique_patients = Appointment.objects.filter(doctor=doctor).values('patient').distinct().count()

        return Response({
            'metrics': {
                'today_appointments_count': len(today_apts_data),
                'upcoming_appointments_count': upcoming_apts_count,
                'completed_appointments_count': completed_count,
                'unique_patients_treated': unique_patients,
            },
            'today_appointments': today_apts_data
        })

class ReceptionDashboardView(views.APIView):
    """Operational front-desk schedule and check-in metrics for Receptionists."""
    permission_classes = [IsReceptionist]

    @extend_schema(responses={200: dict})
    def get(self, request):
        today = date.today()
        today_appointments = Appointment.objects.select_related('patient', 'doctor', 'department').filter(
            appointment_date=today
        ).order_by('start_time')

        counts_by_status = {
            'total': today_appointments.count(),
            'booked': today_appointments.filter(status=AppointmentStatus.BOOKED).count(),
            'checked_in': today_appointments.filter(status=AppointmentStatus.CHECKED_IN).count(),
            'completed': today_appointments.filter(status=AppointmentStatus.COMPLETED).count(),
            'cancelled': today_appointments.filter(status=AppointmentStatus.CANCELLED).count(),
        }

        schedule_data = [
            {
                'id': a.id,
                'patient_name': a.patient.full_name,
                'patient_number': a.patient.patient_number,
                'doctor_name': a.doctor.full_name,
                'department_name': a.department.name,
                'start_time': a.start_time.strftime('%H:%M'),
                'end_time': a.end_time.strftime('%H:%M'),
                'status': a.status,
            }
            for a in today_appointments
        ]

        total_patients = PatientProfile.objects.count()
        active_doctors = DoctorProfile.objects.filter(is_available=True).count()

        return Response({
            'metrics': {
                'today_counts': counts_by_status,
                'total_patients': total_patients,
                'active_doctors': active_doctors,
            },
            'today_schedule': schedule_data
        })

class PharmacyDashboardView(views.APIView):
    """Pharmacy inventory, pending dispensing, and expiry tracking."""
    permission_classes = [IsPharmacist]

    @extend_schema(responses={200: dict})
    def get(self, request):
        today = date.today()
        pending_prescriptions = Prescription.objects.select_related('patient', 'doctor').filter(
            status__in=[PrescriptionStatus.ISSUED, PrescriptionStatus.PARTIALLY_DISPENSED]
        ).order_by('-issued_at')

        pending_data = [
            {
                'id': p.id,
                'patient_name': p.patient.full_name,
                'patient_number': p.patient.patient_number,
                'doctor_name': p.doctor.full_name,
                'status': p.status,
                'items_count': p.items.count(),
                'issued_at': p.issued_at.strftime('%Y-%m-%d %H:%M')
            }
            for p in pending_prescriptions[:10]
        ]

        all_medicines = Medicine.objects.prefetch_related('batches').filter(is_active=True)
        low_stock_medicines = [
            {'id': m.id, 'name': m.name, 'sku': m.sku, 'total_stock': m.total_stock, 'reorder_level': m.reorder_level}
            for m in all_medicines if m.is_low_stock
        ]

        expired_count = MedicineBatch.objects.filter(expiry_date__lt=today, available_quantity__gt=0).count()
        near_expiry_count = MedicineBatch.objects.filter(
            expiry_date__gte=today,
            expiry_date__lte=today + timedelta(days=30),
            available_quantity__gt=0
        ).count()

        # Recent stock dispensing movements
        recent_movements = StockMovement.objects.select_related('medicine', 'batch', 'performed_by').order_by('-created_at')[:6].values(
            'id', 'medicine__name', 'movement_type', 'quantity_delta', 'reference', 'created_at'
        )

        return Response({
            'metrics': {
                'pending_prescriptions_count': pending_prescriptions.count(),
                'low_stock_count': len(low_stock_medicines),
                'expired_batches_count': expired_count,
                'near_expiry_batches_count': near_expiry_count,
            },
            'pending_prescriptions': pending_data,
            'low_stock_items': low_stock_medicines[:10],
            'recent_movements': list(recent_movements)
        })

class PatientDashboardView(views.APIView):
    """Patient self-service portal: appointments, doctor visits, and active prescriptions."""
    permission_classes = [IsPatient]

    @extend_schema(responses={200: dict})
    def get(self, request):
        user = request.user
        if not hasattr(user, 'patient_profile'):
            return Response({'detail': 'Patient profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        patient = user.patient_profile
        today = date.today()

        upcoming_appointments = Appointment.objects.select_related('doctor', 'department').filter(
            patient=patient,
            appointment_date__gte=today
        ).exclude(status=AppointmentStatus.CANCELLED).order_by('appointment_date', 'start_time')

        past_appointments = Appointment.objects.select_related('doctor', 'department').filter(
            patient=patient,
            appointment_date__lt=today
        ).order_by('-appointment_date', '-start_time')

        prescriptions = Prescription.objects.select_related('doctor').prefetch_related('items__medicine').filter(
            patient=patient
        ).order_by('-issued_at')

        upcoming_data = [
            {
                'id': a.id,
                'doctor_name': a.doctor.full_name,
                'department_name': a.department.name,
                'appointment_date': a.appointment_date.strftime('%Y-%m-%d'),
                'start_time': a.start_time.strftime('%H:%M'),
                'end_time': a.end_time.strftime('%H:%M'),
                'reason_for_visit': a.reason_for_visit,
                'status': a.status
            }
            for a in upcoming_appointments[:5]
        ]

        prescriptions_data = [
            {
                'id': p.id,
                'doctor_name': p.doctor.full_name,
                'status': p.status,
                'issued_at': p.issued_at.strftime('%Y-%m-%d'),
                'items_count': p.items.count()
            }
            for p in prescriptions[:5]
        ]

        return Response({
            'patient_info': {
                'full_name': patient.full_name,
                'patient_number': patient.patient_number,
                'phone': patient.phone,
                'email': patient.email
            },
            'metrics': {
                'upcoming_appointments_count': upcoming_appointments.count(),
                'past_appointments_count': past_appointments.count(),
                'prescriptions_count': prescriptions.count()
            },
            'upcoming_appointments': upcoming_data,
            'recent_prescriptions': prescriptions_data
        })
