from datetime import datetime, date, time, timedelta
from rest_framework import generics, status, views, exceptions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter

from accounts.permissions import IsAdmin
from .models import Department, DoctorProfile, DoctorAvailability, AvailabilityException
from .serializers import (
    DepartmentSerializer,
    DoctorProfileSerializer,
    DoctorProfileCreateSerializer,
    DoctorAvailabilitySerializer,
    AvailabilityExceptionSerializer
)
from appointments.models import Appointment

class DepartmentListCreateView(generics.ListCreateAPIView):
    """List all active departments or create a new department (Admin only)."""
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a department (Admin only for modification)."""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

class DoctorListView(generics.ListCreateAPIView):
    """Search and filter active doctors. Admins can create doctor profiles."""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'is_available']
    search_fields = ['user__first_name', 'user__last_name', 'specialization', 'qualifications']
    ordering_fields = ['experience_years', 'consultation_fee', 'created_at']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DoctorProfileCreateSerializer
        return DoctorProfileSerializer

    def get_queryset(self):
        qs = DoctorProfile.objects.select_related('user', 'department').prefetch_related('working_hours')
        # If public / patient, show only active/available doctors
        if not (self.request.user and self.request.user.is_authenticated and (self.request.user.role == 'ADMIN' or self.request.user.is_superuser)):
            qs = qs.filter(is_available=True, user__is_active=True)
        return qs

class DoctorDetailView(generics.RetrieveUpdateAPIView):
    """View doctor profile or update permitted fields (Admin or the Doctor themselves)."""
    queryset = DoctorProfile.objects.select_related('user', 'department').all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DoctorProfileCreateSerializer
        return DoctorProfileSerializer

    def perform_update(self, serializer):
        user = self.request.user
        doctor = self.get_object()
        if not (user.role == 'ADMIN' or user.is_superuser or doctor.user_id == user.id):
            raise exceptions.PermissionDenied("You are not authorized to edit this doctor's profile.")
        # If doctor is editing themselves, prevent changing user or department
        if doctor.user_id == user.id and not (user.role == 'ADMIN' or user.is_superuser):
            serializer.save(user=doctor.user, department=doctor.department)
        else:
            serializer.save()

class DoctorAvailabilitySlotsView(views.APIView):
    """
    Computes real-time available appointment slots for a specific doctor on a given date (YYYY-MM-DD),
    taking into account weekly working hours, exceptions/leave, and existing bookings.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter('date', str, description='Target appointment date (YYYY-MM-DD)', required=False)
        ],
        responses={200: dict}
    )
    def get(self, request, pk):
        try:
            doctor = DoctorProfile.objects.get(pk=pk, is_available=True)
        except DoctorProfile.DoesNotExist:
            return Response({'detail': 'Doctor not found or not active.'}, status=status.HTTP_404_NOT_FOUND)

        target_date_str = request.query_params.get('date')
        if not target_date_str:
            target_date = date.today()
        else:
            try:
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Check all-day leave or blocked exceptions
        all_day_block = AvailabilityException.objects.filter(
            doctor=doctor,
            date=target_date,
            is_all_day=True,
            exception_type='BLOCKED'
        ).first()

        if all_day_block:
            return Response({
                'date': target_date.strftime('%Y-%m-%d'),
                'doctor_id': doctor.id,
                'doctor_name': doctor.full_name,
                'is_available': False,
                'message': 'Doctor is on leave or unavailable on this date.',
                'slots': []
            })

        # 2. Find regular working hours for this weekday (0=Monday, 6=Sunday)
        weekday = target_date.weekday()
        availabilities = DoctorAvailability.objects.filter(
            doctor=doctor,
            weekday=weekday,
            active=True
        )

        # 3. Check for specific time block exceptions on that date
        blocked_exceptions = AvailabilityException.objects.filter(
            doctor=doctor,
            date=target_date,
            exception_type='BLOCKED',
            is_all_day=False
        )

        # 4. Existing booked/confirmed appointments
        existing_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=target_date
        ).exclude(status='CANCELLED')

        booked_ranges = [(apt.start_time, apt.end_time) for apt in existing_appointments]
        blocked_ranges = [(exc.start_time, exc.end_time) for exc in blocked_exceptions if exc.start_time and exc.end_time]

        slots = []
        for sched in availabilities:
            slot_duration = timedelta(minutes=sched.slot_duration_minutes)
            curr_start_dt = datetime.combine(target_date, sched.start_time)
            curr_end_dt = datetime.combine(target_date, sched.end_time)

            while curr_start_dt + slot_duration <= curr_end_dt:
                slot_s = curr_start_dt.time()
                slot_e = (curr_start_dt + slot_duration).time()

                # Check if slot falls in a blocked range
                is_blocked = any(
                    (slot_s < b_end and slot_e > b_start)
                    for (b_start, b_end) in blocked_ranges
                )

                # Check if slot overlaps any booked appointment
                is_booked = any(
                    (slot_s < apt_e and slot_e > apt_s)
                    for (apt_s, apt_e) in booked_ranges
                )

                slots.append({
                    'start_time': slot_s.strftime('%H:%M'),
                    'end_time': slot_e.strftime('%H:%M'),
                    'is_available': not (is_blocked or is_booked),
                    'status': 'BOOKED' if is_booked else ('BLOCKED' if is_blocked else 'AVAILABLE')
                })

                curr_start_dt += slot_duration

        return Response({
            'date': target_date.strftime('%Y-%m-%d'),
            'doctor_id': doctor.id,
            'doctor_name': doctor.full_name,
            'is_available': len([s for s in slots if s['is_available']]) > 0,
            'slots': slots
        })

class DoctorAvailabilityManageView(generics.ListCreateAPIView):
    """View and configure weekly working hours for a doctor."""
    permission_classes = [IsAuthenticated]
    serializer_class = DoctorAvailabilitySerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or 'pk' not in self.kwargs:
            return DoctorAvailability.objects.none()
        return DoctorAvailability.objects.filter(doctor_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        user = self.request.user
        doctor = DoctorProfile.objects.get(pk=self.kwargs['pk'])
        if not (user.role == 'ADMIN' or user.is_superuser or doctor.user_id == user.id):
            raise exceptions.PermissionDenied("You are not authorized to configure availability for this doctor.")
        serializer.save(doctor=doctor)

class DoctorExceptionManageView(generics.ListCreateAPIView):
    """View and add specific date exceptions / leaves for a doctor."""
    permission_classes = [IsAuthenticated]
    serializer_class = AvailabilityExceptionSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or 'pk' not in self.kwargs:
            return AvailabilityException.objects.none()
        user = self.request.user
        doctor = DoctorProfile.objects.get(pk=self.kwargs['pk'])
        # Patients shouldn't see internal reason notes, but staff can view
        return AvailabilityException.objects.filter(doctor=doctor).order_by('date')

    def perform_create(self, serializer):
        user = self.request.user
        doctor = DoctorProfile.objects.get(pk=self.kwargs['pk'])
        if not (user.role in ['ADMIN', 'RECEPTIONIST'] or user.is_superuser or doctor.user_id == user.id):
            raise exceptions.PermissionDenied("Only the doctor or authorized staff can record availability exceptions.")
        serializer.save(doctor=doctor)
