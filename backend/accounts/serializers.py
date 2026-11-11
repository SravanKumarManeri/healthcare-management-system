from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from patients.models import PatientProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    patient_id = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone', 'is_active',
            'patient_id', 'doctor_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'role_display', 'is_active', 'created_at', 'updated_at']

    def get_patient_id(self, obj):
        if hasattr(obj, 'patient_profile') and obj.patient_profile:
            return obj.patient_profile.id
        return None

    def get_doctor_id(self, obj):
        if hasattr(obj, 'doctor_profile') and obj.doctor_profile:
            return obj.doctor_profile.id
        return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    gender = serializers.CharField(write_only=True, required=False, default='PREFER_NOT_TO_SAY')
    address = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    emergency_contact_name = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    emergency_contact_phone = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'phone', 'date_of_birth', 'gender', 'address',
            'emergency_contact_name', 'emergency_contact_phone'
        ]

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # Extract patient-specific demographic fields
        dob = validated_data.pop('date_of_birth', None)
        gender = validated_data.pop('gender', 'PREFER_NOT_TO_SAY')
        address = validated_data.pop('address', '')
        emergency_name = validated_data.pop('emergency_contact_name', '')
        emergency_phone = validated_data.pop('emergency_contact_phone', '')

        # Strictly enforce PATIENT role for self-registration
        validated_data['role'] = 'PATIENT'
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Automatically create linked PatientProfile
        PatientProfile.objects.create(
            user=user,
            first_name=user.first_name or user.username,
            last_name=user.last_name or '',
            date_of_birth=dob,
            gender=gender,
            phone=user.phone or '',
            email=user.email or '',
            address=address,
            emergency_contact_name=emergency_name,
            emergency_contact_phone=emergency_phone
        )
        return user

class StaffUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone']

    def validate_role(self, value):
        if value not in ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST']:
            raise serializers.ValidationError("Role must be ADMIN, DOCTOR, RECEPTIONIST, or PHARMACIST.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'email']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is not correct.")
        return value
