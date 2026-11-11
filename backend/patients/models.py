import uuid
from django.db import models
from django.conf import settings

def generate_patient_number():
    """Generates a clean, unique patient identifier (e.g. PAT-9A8B7C6D)."""
    return f"PAT-{uuid.uuid4().hex[:8].upper()}"

class PatientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patient_profile',
        help_text="Linked user account for patient self-service portal."
    )
    patient_number = models.CharField(
        max_length=30,
        unique=True,
        default=generate_patient_number,
        db_index=True,
        editable=False,
        help_text="System-generated unique identifier."
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=[
            ('MALE', 'Male'),
            ('FEMALE', 'Female'),
            ('OTHER', 'Other'),
            ('PREFER_NOT_TO_SAY', 'Prefer not to say'),
        ],
        default='PREFER_NOT_TO_SAY'
    )
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    emergency_contact_name = models.CharField(max_length=150, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default='')
    blood_group = models.CharField(
        max_length=10,
        choices=[
            ('A+', 'A+'), ('A-', 'A-'),
            ('B+', 'B+'), ('B-', 'B-'),
            ('AB+', 'AB+'), ('AB-', 'AB-'),
            ('O+', 'O+'), ('O-', 'O-'),
            ('UNKNOWN', 'Unknown'),
        ],
        default='UNKNOWN'
    )
    administrative_notes = models.TextField(
        blank=True,
        default='',
        help_text="Non-clinical administrative notes for reception and billing coordination."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient_number']),
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['phone']),
        ]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.patient_number})"
