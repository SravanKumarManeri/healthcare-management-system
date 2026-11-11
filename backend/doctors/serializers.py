from rest_framework import serializers
from .models import Department, DoctorProfile, DoctorAvailability, AvailabilityException

class DepartmentSerializer(serializers.ModelSerializer):
    doctors_count = serializers.IntegerField(source='doctors.count', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'is_active', 'doctors_count', 'created_at']

class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = [
            'id', 'doctor', 'weekday', 'weekday_display', 'start_time',
            'end_time', 'slot_duration_minutes', 'active', 'effective_from', 'effective_until'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        start = attrs.get('start_time')
        end = attrs.get('end_time')
        if start and end and end <= start:
            raise serializers.ValidationError("End time must be after start time.")
        return attrs

class AvailabilityExceptionSerializer(serializers.ModelSerializer):
    exception_type_display = serializers.CharField(source='get_exception_type_display', read_only=True)

    class Meta:
        model = AvailabilityException
        fields = [
            'id', 'doctor', 'date', 'start_time', 'end_time',
            'is_all_day', 'exception_type', 'exception_type_display',
            'reason', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class DoctorProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.CharField(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    working_hours = DoctorAvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'user_email', 'full_name', 'department', 'department_name',
            'specialization', 'qualifications', 'experience_years', 'consultation_fee',
            'phone', 'bio', 'is_available', 'working_hours', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class DoctorProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'department', 'specialization', 'qualifications',
            'experience_years', 'consultation_fee', 'phone', 'bio', 'is_available'
        ]
