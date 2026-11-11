from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Medicine(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    generic_name = models.CharField(max_length=200, blank=True, default='')
    strength = models.CharField(max_length=100, help_text="e.g. 500 mg, 10 ml")
    dosage_form = models.CharField(
        max_length=50,
        choices=[
            ('TABLET', 'Tablet'),
            ('CAPSULE', 'Capsule'),
            ('SYRUP', 'Syrup / Suspension'),
            ('INJECTION', 'Injection'),
            ('OINTMENT', 'Ointment / Cream'),
            ('DROPS', 'Drops'),
            ('INHALER', 'Inhaler'),
            ('OTHER', 'Other'),
        ],
        default='TABLET'
    )
    manufacturer = models.CharField(max_length=150, blank=True, default='')
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    unit = models.CharField(max_length=50, default='Strip', help_text="e.g. Strip, Bottle, Box")
    reorder_level = models.PositiveIntegerField(default=20, help_text="Trigger low-stock alert below this count.")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    @property
    def total_stock(self):
        return sum(batch.available_quantity for batch in self.batches.all())

    @property
    def is_low_stock(self):
        return self.total_stock <= self.reorder_level

    def __str__(self):
        return f"{self.name} {self.strength} ({self.sku})"

class MedicineBatch(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name='batches'
    )
    batch_number = models.CharField(max_length=60, db_index=True)
    expiry_date = models.DateField(db_index=True)
    quantity_received = models.PositiveIntegerField()
    available_quantity = models.PositiveIntegerField()
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['expiry_date', 'received_at']
        constraints = [
            models.UniqueConstraint(
                fields=['medicine', 'batch_number'],
                name='unique_medicine_batch_number'
            )
        ]

    def clean(self):
        if self.available_quantity > self.quantity_received:
            raise ValidationError("Available quantity cannot exceed received quantity.")

    def __str__(self):
        return f"{self.medicine.name} - Batch {self.batch_number} (Exp: {self.expiry_date}, Avail: {self.available_quantity})"

class MovementType(models.TextChoices):
    RECEIVED = 'RECEIVED', 'Stock Received'
    DISPENSED = 'DISPENSED', 'Prescription Dispensed'
    ADJUSTMENT = 'ADJUSTMENT', 'Stock Adjustment / Write-off'

class StockMovement(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name='stock_movements'
    )
    batch = models.ForeignKey(
        MedicineBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movements'
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity_delta = models.IntegerField(help_text="Positive for addition, negative for deduction.")
    reason = models.TextField(blank=True, default='')
    reference = models.CharField(max_length=100, blank=True, default='', help_text="PO number, prescription ID, etc.")
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.medicine.name}: {self.quantity_delta:+d} ({self.movement_type}) at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class PrescriptionStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    ISSUED = 'ISSUED', 'Issued / Pending Dispense'
    PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED', 'Partially Dispensed'
    DISPENSED = 'DISPENSED', 'Fully Dispensed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Prescription(models.Model):
    patient = models.ForeignKey(
        'patients.PatientProfile',
        on_delete=models.CASCADE,
        related_name='prescriptions'
    )
    doctor = models.ForeignKey(
        'doctors.DoctorProfile',
        on_delete=models.CASCADE,
        related_name='prescriptions'
    )
    consultation = models.ForeignKey(
        'consultations.Consultation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prescriptions'
    )
    status = models.CharField(
        max_length=25,
        choices=PrescriptionStatus.choices,
        default=PrescriptionStatus.ISSUED,
        db_index=True
    )
    notes = models.TextField(blank=True, default='', help_text="Special pharmacist or patient instructions.")
    issued_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"Prescription #{self.id} for {self.patient.full_name} by {self.doctor.full_name} ({self.status})"

class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name='items'
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT,
        related_name='prescription_items'
    )
    dosage_instructions = models.CharField(max_length=200, help_text="e.g. 1 Tablet after food")
    frequency = models.CharField(max_length=100, help_text="e.g. Twice a day (BD)")
    duration = models.CharField(max_length=100, help_text="e.g. 5 days")
    quantity = models.PositiveIntegerField(help_text="Total units prescribed")
    dispensed_quantity = models.PositiveIntegerField(default=0)
    notes = models.CharField(max_length=255, blank=True, default='')

    @property
    def remaining_quantity(self):
        return max(0, self.quantity - self.dispensed_quantity)

    @property
    def is_fully_dispensed(self):
        return self.dispensed_quantity >= self.quantity

    def __str__(self):
        return f"{self.medicine.name} x {self.quantity} ({self.dispensed_quantity} dispensed)"

class DispensingRecord(models.Model):
    prescription_item = models.ForeignKey(
        PrescriptionItem,
        on_delete=models.CASCADE,
        related_name='dispensing_records'
    )
    medicine_batch = models.ForeignKey(
        MedicineBatch,
        on_delete=models.PROTECT,
        related_name='dispensing_records'
    )
    quantity_dispensed = models.PositiveIntegerField()
    dispensed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    dispensed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-dispensed_at']

    def clean(self):
        if self.prescription_item.medicine_id != self.medicine_batch.medicine_id:
            raise ValidationError("Dispensed batch does not match prescribed medicine.")

    def __str__(self):
        return f"Dispensed {self.quantity_dispensed} of {self.prescription_item.medicine.name} (Batch {self.medicine_batch.batch_number})"
