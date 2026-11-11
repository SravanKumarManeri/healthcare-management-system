from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from datetime import date
from .models import (
    Medicine,
    MedicineBatch,
    StockMovement,
    Prescription,
    PrescriptionItem,
    DispensingRecord,
    PrescriptionStatus,
    MovementType
)
from patients.models import PatientProfile
from doctors.models import DoctorProfile

class MedicineBatchSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = MedicineBatch
        fields = [
            'id', 'medicine', 'batch_number', 'expiry_date',
            'quantity_received', 'available_quantity', 'is_expired', 'received_at'
        ]
        read_only_fields = ['id', 'received_at']

    def get_is_expired(self, obj):
        return obj.expiry_date < date.today()

class MedicineSerializer(serializers.ModelSerializer):
    total_stock = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    batches = MedicineBatchSerializer(many=True, read_only=True)
    dosage_form_display = serializers.CharField(source='get_dosage_form_display', read_only=True)

    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'generic_name', 'strength', 'dosage_form',
            'dosage_form_display', 'manufacturer', 'sku', 'unit',
            'reorder_level', 'total_stock', 'is_low_stock', 'is_active',
            'batches', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class StockReceiptSerializer(serializers.Serializer):
    medicine_id = serializers.IntegerField(required=True)
    batch_number = serializers.CharField(max_length=60, required=True)
    expiry_date = serializers.DateField(required=True)
    quantity = serializers.IntegerField(min_value=1, required=True)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    def validate_expiry_date(self, value):
        if value <= date.today():
            raise serializers.ValidationError("Cannot receive stock with past or today's expiry date.")
        return value

class StockAdjustmentSerializer(serializers.Serializer):
    medicine_id = serializers.IntegerField(required=True)
    batch_id = serializers.IntegerField(required=False, allow_null=True)
    quantity_delta = serializers.IntegerField(required=True) # positive or negative
    reason = serializers.CharField(required=True, min_length=3)

class DispensingRecordSerializer(serializers.ModelSerializer):
    batch_number = serializers.CharField(source='medicine_batch.batch_number', read_only=True)
    dispensed_by_username = serializers.CharField(source='dispensed_by.username', read_only=True)

    class Meta:
        model = DispensingRecord
        fields = [
            'id', 'prescription_item', 'medicine_batch', 'batch_number',
            'quantity_dispensed', 'dispensed_by_username', 'dispensed_at'
        ]
        read_only_fields = ['id', 'dispensed_at']

class PrescriptionItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_strength = serializers.CharField(source='medicine.strength', read_only=True)
    dispensing_records = DispensingRecordSerializer(many=True, read_only=True)
    remaining_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = [
            'id', 'medicine', 'medicine_name', 'medicine_strength',
            'dosage_instructions', 'frequency', 'duration', 'quantity',
            'dispensed_quantity', 'remaining_quantity', 'notes', 'dispensing_records'
        ]
        read_only_fields = ['id', 'dispensed_quantity', 'remaining_quantity', 'dispensing_records']

class PrescriptionItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = ['medicine', 'dosage_instructions', 'frequency', 'duration', 'quantity', 'notes']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_number = serializers.CharField(source='patient.patient_number', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    items = PrescriptionItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'patient', 'patient_name', 'patient_number', 'doctor',
            'doctor_name', 'consultation', 'status', 'status_display',
            'notes', 'items', 'issued_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'doctor', 'status', 'issued_at', 'created_at', 'updated_at']

class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemCreateSerializer(many=True, required=True)

    class Meta:
        model = Prescription
        fields = ['id', 'patient', 'consultation', 'notes', 'items']
        read_only_fields = ['id']

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Prescription must contain at least one item.")
        return items

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        user = request.user if request else None

        if user and user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile'):
                raise serializers.ValidationError("Doctor profile not found for this user.")
            validated_data['doctor'] = user.doctor_profile

        with transaction.atomic():
            prescription = Prescription.objects.create(
                status=PrescriptionStatus.ISSUED,
                **validated_data
            )
            for item in items_data:
                PrescriptionItem.objects.create(prescription=prescription, **item)

        return prescription

class StockMovementSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True, default='')
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'medicine', 'medicine_name', 'batch', 'batch_number',
            'movement_type', 'quantity_delta', 'reason', 'reference',
            'performed_by_username', 'created_at'
        ]
