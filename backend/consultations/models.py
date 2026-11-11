from django.db import models

class ConsultationStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    FINAL = 'FINAL', 'Final'

class Consultation(models.Model):
    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='consultation'
    )
    patient = models.ForeignKey(
        'patients.PatientProfile',
        on_delete=models.CASCADE,
        related_name='consultations'
    )
    doctor = models.ForeignKey(
        'doctors.DoctorProfile',
        on_delete=models.CASCADE,
        related_name='consultations'
    )
    symptoms_or_history = models.TextField(help_text="Chief complaints and history of present illness.")
    examination_notes = models.TextField(blank=True, default='', help_text="Physical examination findings.")
    diagnosis = models.TextField(help_text="Primary and differential clinical impression (demo data).")
    advice = models.TextField(blank=True, default='', help_text="Dietary, lifestyle, or precautions.")
    follow_up_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=ConsultationStatus.choices,
        default=ConsultationStatus.FINAL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Consultation for Apt #{self.appointment.id} ({self.patient.full_name} by {self.doctor.full_name})"
