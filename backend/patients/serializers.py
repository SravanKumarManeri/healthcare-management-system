from rest_framework import serializers
from .models import PatientProfile

class PatientProfileSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True, default='')
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user', 'user_username', 'patient_number', 'first_name', 'last_name',
            'full_name', 'date_of_birth', 'gender', 'phone', 'email', 'address',
            'emergency_contact_name', 'emergency_contact_phone', 'blood_group',
            'administrative_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'patient_number', 'user', 'created_at', 'updated_at']

class PatientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            'id', 'patient_number', 'first_name', 'last_name', 'date_of_birth',
            'gender', 'phone', 'email', 'address', 'emergency_contact_name',
            'emergency_contact_phone', 'blood_group', 'administrative_notes'
        ]
        read_only_fields = ['id', 'patient_number']

class PatientSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = PatientProfile
        fields = ['id', 'patient_number', 'full_name', 'phone', 'date_of_birth', 'gender']
