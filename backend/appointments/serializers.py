from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from datetime import datetime, date
from .models import Appointment, AppointmentStatusHistory, AppointmentStatus
from patients.models import PatientProfile
from doctors.models import DoctorProfile, Department, AvailabilityException, DoctorAvailability

class AppointmentStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source='changed_by.username', read_only=True, default='')

    class Meta:
        model = AppointmentStatusHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by_username', 'reason', 'changed_at']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_number = serializers.CharField(source='patient.patient_number', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_consultation = serializers.SerializerMethodField()
    has_prescription = serializers.SerializerMethodField()
    status_history = AppointmentStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'patient_number', 'patient_phone',
            'doctor', 'doctor_name', 'doctor_specialization', 'department', 'department_name',
            'appointment_date', 'start_time', 'end_time', 'reason_for_visit',
            'status', 'status_display', 'cancellation_reason', 'has_consultation',
            'has_prescription', 'status_history', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'department', 'status', 'created_at', 'updated_at']

    def get_has_consultation(self, obj):
        return hasattr(obj, 'consultation') and obj.consultation is not None

    def get_has_prescription(self, obj):
        if hasattr(obj, 'consultation') and obj.consultation:
            return obj.consultation.prescriptions.exists()
        return False

class AppointmentBookingSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(
        queryset=PatientProfile.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'appointment_date', 'start_time', 'end_time', 'reason_for_visit']
        read_only_fields = ['id']

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None

        if user and user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile'):
                raise serializers.ValidationError({"patient": "Patient profile not found for this user account."})
            attrs['patient'] = user.patient_profile
        elif not attrs.get('patient'):
            raise serializers.ValidationError({"patient": "Patient is required."})

        doctor = attrs.get('doctor')
        apt_date = attrs.get('appointment_date')
        start = attrs.get('start_time')
        end = attrs.get('end_time')

        if apt_date < date.today():
            raise serializers.ValidationError({"appointment_date": "Appointments cannot be booked in the past."})

        if end <= start:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})

        # 1. Check all-day block/leave
        if AvailabilityException.objects.filter(doctor=doctor, date=apt_date, is_all_day=True, exception_type='BLOCKED').exists():
            raise serializers.ValidationError({"doctor": f"{doctor.full_name} is on leave on {apt_date}."})

        # 2. Check partial time block
        if AvailabilityException.objects.filter(
            doctor=doctor, date=apt_date, exception_type='BLOCKED', is_all_day=False,
            start_time__lt=end, end_time__gt=start
        ).exists():
            raise serializers.ValidationError({"start_time": f"{doctor.full_name} is unavailable during this time window."})

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        # Automatically assign department from doctor
        doctor = validated_data['doctor']
        validated_data['department'] = doctor.department
        validated_data['created_by'] = user
        validated_data['status'] = AppointmentStatus.BOOKED

        # Enforce patient scoping for patient self-booking
        if user and user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile'):
                raise serializers.ValidationError({"patient": "Patient profile not found for this account."})
            validated_data['patient'] = user.patient_profile

        # ATOMIC TRANSACTION WITH LOCK TO PREVENT DOUBLE BOOKING
        with transaction.atomic():
            # Lock existing active appointments for doctor on that date
            overlapping = Appointment.objects.select_for_update().filter(
                doctor=doctor,
                appointment_date=validated_data['appointment_date'],
                start_time__lt=validated_data['end_time'],
                end_time__gt=validated_data['start_time']
            ).exclude(status=AppointmentStatus.CANCELLED)

            if overlapping.exists():
                raise serializers.ValidationError({
                    "start_time": "This time slot is no longer available. Please select another slot."
                })

            appointment = super().create(validated_data)

            # Record initial history
            AppointmentStatusHistory.objects.create(
                appointment=appointment,
                old_status='',
                new_status=AppointmentStatus.BOOKED,
                changed_by=user,
                reason='Initial appointment booking'
            )

        return appointment

class AppointmentRescheduleSerializer(serializers.Serializer):
    appointment_date = serializers.DateField(required=True)
    start_time = serializers.TimeField(required=True)
    end_time = serializers.TimeField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        apt_date = attrs.get('appointment_date')
        start = attrs.get('start_time')
        end = attrs.get('end_time')

        if apt_date < date.today():
            raise serializers.ValidationError({"appointment_date": "Cannot reschedule to a past date."})
        if end <= start:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        return attrs
