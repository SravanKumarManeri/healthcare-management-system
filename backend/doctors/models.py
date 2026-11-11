from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Department(models.Model):
    name = models.CharField(max_length=120, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class DoctorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='doctors'
    )
    specialization = models.CharField(max_length=150, db_index=True)
    qualifications = models.CharField(max_length=200, help_text="e.g. MBBS, MD, FRCS")
    experience_years = models.PositiveIntegerField(default=1)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    phone = models.CharField(max_length=20, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user__first_name', 'user__last_name']

    @property
    def full_name(self):
        name = f"{self.user.first_name} {self.user.last_name}".strip()
        return f"Dr. {name}" if name else f"Dr. {self.user.username}"

    def __str__(self):
        return f"{self.full_name} - {self.specialization} ({self.department.name})"

class WeekdayChoices(models.IntegerChoices):
    MONDAY = 0, 'Monday'
    TUESDAY = 1, 'Tuesday'
    WEDNESDAY = 2, 'Wednesday'
    THURSDAY = 3, 'Thursday'
    FRIDAY = 4, 'Friday'
    SATURDAY = 5, 'Saturday'
    SUNDAY = 6, 'Sunday'

class DoctorAvailability(models.Model):
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='working_hours'
    )
    weekday = models.IntegerField(choices=WeekdayChoices.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)
    active = models.BooleanField(default=True)
    effective_from = models.DateField(null=True, blank=True)
    effective_until = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['weekday', 'start_time']
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F('start_time')),
                name='doctor_availability_end_gt_start'
            )
        ]

    def clean(self):
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError("End time must be later than start time.")

    def __str__(self):
        return f"{self.doctor.full_name} - {self.get_weekday_display()}: {self.start_time.strftime('%H:%M')} to {self.end_time.strftime('%H:%M')}"

class AvailabilityException(models.Model):
    EXCEPTION_TYPES = [
        ('BLOCKED', 'Blocked / Leave'),
        ('EXTRA', 'Extra Working Hours'),
    ]
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='schedule_exceptions'
    )
    date = models.DateField(db_index=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_all_day = models.BooleanField(default=False)
    exception_type = models.CharField(max_length=20, choices=EXCEPTION_TYPES, default='BLOCKED')
    reason = models.TextField(blank=True, default='', help_text="Internal staff notes.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']

    def clean(self):
        if not self.is_all_day:
            if not self.start_time or not self.end_time:
                raise ValidationError("Start and end time required when not an all-day exception.")
            if self.end_time <= self.start_time:
                raise ValidationError("End time must be later than start time.")

    def __str__(self):
        return f"{self.doctor.full_name} Exception ({self.date}): {self.get_exception_type_display()}"
