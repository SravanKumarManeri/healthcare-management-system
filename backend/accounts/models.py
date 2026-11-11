from django.db import models
from django.contrib.auth.models import AbstractUser

class RoleChoices(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrator'
    DOCTOR = 'DOCTOR', 'Doctor'
    RECEPTIONIST = 'RECEPTIONIST', 'Receptionist'
    PHARMACIST = 'PHARMACIST', 'Pharmacist'
    PATIENT = 'PATIENT', 'Patient'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.PATIENT,
        db_index=True,
        help_text="System role determining permissions and access scope."
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_admin_role(self):
        return self.role == RoleChoices.ADMIN or self.is_superuser

    @property
    def is_doctor(self):
        return self.role == RoleChoices.DOCTOR

    @property
    def is_receptionist(self):
        return self.role == RoleChoices.RECEPTIONIST

    @property
    def is_pharmacist(self):
        return self.role == RoleChoices.PHARMACIST

    @property
    def is_patient(self):
        return self.role == RoleChoices.PATIENT

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
