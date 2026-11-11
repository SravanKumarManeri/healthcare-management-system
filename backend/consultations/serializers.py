from rest_framework import serializers
from .models import Consultation, ConsultationStatus
from appointments.models import Appointment, AppointmentStatus

class ConsultationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_number = serializers.CharField(source='patient.patient_number', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True)

    class Meta:
        model = Consultation
        fields = [
            'id', 'appointment', 'appointment_date', 'patient', 'patient_name',
            'patient_number', 'doctor', 'doctor_name', 'symptoms_or_history',
            'examination_notes', 'diagnosis', 'advice', 'follow_up_date',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'patient', 'doctor', 'created_at', 'updated_at']

    def validate_appointment(self, appointment):
        # Ensure consultation doesn't already exist for this appointment
        if Consultation.objects.filter(appointment=appointment).exists():
            raise serializers.ValidationError("A consultation record already exists for this appointment.")
        return appointment

    def create(self, validated_data):
        appointment = validated_data['appointment']
        request = self.context.get('request')
        user = request.user if request else None

        # Verify doctor is assigned to this appointment
        if user and user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile') or appointment.doctor_id != user.doctor_profile.id:
                raise serializers.ValidationError("You are not the assigned doctor for this appointment.")

        validated_data['patient'] = appointment.patient
        validated_data['doctor'] = appointment.doctor

        consultation = super().create(validated_data)

        # Automatically mark appointment as completed if consultation is final
        if consultation.status == ConsultationStatus.FINAL and appointment.status != AppointmentStatus.COMPLETED:
            appointment.status = AppointmentStatus.COMPLETED
            appointment.save()

        return consultation
