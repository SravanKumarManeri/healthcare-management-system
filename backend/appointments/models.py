from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class AppointmentStatus(models.TextChoices):
    BOOKED = 'BOOKED', 'Booked'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    CHECKED_IN = 'CHECKED_IN', 'Checked In'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    NO_SHOW = 'NO_SHOW', 'No Show'

class Appointment(models.Model):
    patient = models.ForeignKey(
        'patients.PatientProfile',
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    doctor = models.ForeignKey(
        'doctors.DoctorProfile',
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    department = models.ForeignKey(
        'doctors.Department',
        on_delete=models.PROTECT,
        related_name='appointments'
    )
    appointment_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason_for_visit = models.CharField(max_length=255, default='General Consultation')
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.BOOKED,
        db_index=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_appointments'
    )
    cancellation_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['appointment_date', 'start_time']
        indexes = [
            models.Index(fields=['appointment_date', 'status']),
            models.Index(fields=['doctor', 'appointment_date']),
            models.Index(fields=['patient', 'appointment_date']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F('start_time')),
                name='appointment_end_gt_start'
            )
        ]

    def clean(self):
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time.")

    def __str__(self):
        return f"Apt #{self.id}: {self.patient.full_name} with {self.doctor.full_name} on {self.appointment_date} ({self.status})"

class AppointmentStatusHistory(models.Model):
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    old_status = models.CharField(max_length=20, blank=True, default='')
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    reason = models.TextField(blank=True, default='')
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"Apt #{self.appointment.id}: {self.old_status} -> {self.new_status} at {self.changed_at.strftime('%Y-%m-%d %H:%M')}"
