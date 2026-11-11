from rest_framework import generics, status, views, exceptions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone
from datetime import date
from drf_spectacular.utils import extend_schema

from accounts.permissions import IsAdmin, IsReceptionist, IsDoctor
from .models import Appointment, AppointmentStatusHistory, AppointmentStatus
from .serializers import (
    AppointmentSerializer,
    AppointmentBookingSerializer,
    AppointmentRescheduleSerializer,
    AppointmentStatusHistorySerializer
)
from doctors.models import AvailabilityException

class AppointmentListCreateView(generics.ListCreateAPIView):
    """
    List appointments (role-scoped) or book a new appointment with concurrency-safe slot locking.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['appointment_date', 'status', 'doctor', 'patient', 'department']
    search_fields = [
        'patient__first_name', 'patient__last_name', 'patient__patient_number',
        'doctor__user__first_name', 'doctor__user__last_name', 'reason_for_visit'
    ]
    ordering_fields = ['appointment_date', 'start_time', 'created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentBookingSerializer
        return AppointmentSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Appointment.objects.none()
        user = self.request.user
        qs = Appointment.objects.select_related(
            'patient', 'doctor', 'doctor__user', 'doctor__department', 'department'
        ).prefetch_related('status_history')

        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile'):
                return Appointment.objects.none()
            return qs.filter(patient=user.patient_profile)

        elif user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile'):
                return Appointment.objects.none()
            return qs.filter(doctor=user.doctor_profile)

        # RECEPTIONIST, ADMIN, and PHARMACIST can view clinic appointments
        return qs.all().order_by('appointment_date', 'start_time')

class AppointmentDetailView(generics.RetrieveAPIView):
    """View details of a specific appointment with role-based scoping."""
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer
    queryset = Appointment.objects.all()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile') or obj.patient_id != user.patient_profile.id:
                raise exceptions.PermissionDenied("You do not have access to view this appointment.")
        elif user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile') or obj.doctor_id != user.doctor_profile.id:
                raise exceptions.PermissionDenied("You are not assigned to this appointment.")

        return obj

class AppointmentRescheduleView(views.APIView):
    """
    Reschedule an existing appointment to a new date and time slot.
    Executed in a transaction so original booking is preserved if the new slot is unavailable.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AppointmentRescheduleSerializer, responses={200: AppointmentSerializer})
    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.select_related('doctor', 'patient').get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        # Only Patient (own appointment), Receptionist, or Admin can reschedule
        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile') or appointment.patient_id != user.patient_profile.id:
                raise exceptions.PermissionDenied("You can only reschedule your own appointments.")
            if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
                return Response({'detail': 'Cannot reschedule completed or cancelled appointments.'}, status=status.HTTP_400_BAD_REQUEST)
        elif user.role not in ['ADMIN', 'RECEPTIONIST'] and not user.is_superuser:
            raise exceptions.PermissionDenied("Only patients, receptionists, or admins can reschedule appointments.")

        serializer = AppointmentRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_date = serializer.validated_data['appointment_date']
        new_start = serializer.validated_data['start_time']
        new_end = serializer.validated_data['end_time']
        reason = serializer.validated_data.get('reason', 'Rescheduled by user')

        with transaction.atomic():
            # Check availability exception
            if AvailabilityException.objects.filter(
                doctor=appointment.doctor, date=new_date, is_all_day=True, exception_type='BLOCKED'
            ).exists():
                return Response({'detail': 'Doctor is on leave on the requested date.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check overlap excluding current appointment
            overlapping = Appointment.objects.select_for_update().filter(
                doctor=appointment.doctor,
                appointment_date=new_date,
                start_time__lt=new_end,
                end_time__gt=new_start
            ).exclude(id=appointment.id).exclude(status=AppointmentStatus.CANCELLED)

            if overlapping.exists():
                return Response({'detail': 'The requested new slot is already booked.'}, status=status.HTTP_400_BAD_REQUEST)

            old_info = f"Was {appointment.appointment_date} {appointment.start_time.strftime('%H:%M')}"
            appointment.appointment_date = new_date
            appointment.start_time = new_start
            appointment.end_time = new_end
            if appointment.status == AppointmentStatus.CANCELLED:
                appointment.status = AppointmentStatus.BOOKED
            appointment.save()

            AppointmentStatusHistory.objects.create(
                appointment=appointment,
                old_status=appointment.status,
                new_status=appointment.status,
                changed_by=user,
                reason=f"Rescheduled. {old_info}. Note: {reason}"
            )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

class AppointmentCancelView(views.APIView):
    """Cancel an appointment with audit trail."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=dict, responses={200: dict})
    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile') or appointment.patient_id != user.patient_profile.id:
                raise exceptions.PermissionDenied("You can only cancel your own appointments.")
            if appointment.appointment_date < date.today():
                return Response({'detail': 'Cannot cancel past appointments.'}, status=status.HTTP_400_BAD_REQUEST)
        elif user.role not in ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] and not user.is_superuser:
            raise exceptions.PermissionDenied("You are not authorized to cancel this appointment.")

        if appointment.status == AppointmentStatus.COMPLETED:
            return Response({'detail': 'Completed appointments cannot be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Cancelled by user')
        old_status = appointment.status
        appointment.status = AppointmentStatus.CANCELLED
        appointment.cancellation_reason = reason
        appointment.save()

        AppointmentStatusHistory.objects.create(
            appointment=appointment,
            old_status=old_status,
            new_status=AppointmentStatus.CANCELLED,
            changed_by=user,
            reason=reason
        )

        return Response({'detail': 'Appointment cancelled successfully.', 'status': AppointmentStatus.CANCELLED})

class AppointmentCheckInView(views.APIView):
    """Receptionist checks in patient upon arrival at the clinic."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: dict})
    def post(self, request, pk):
        user = request.user
        if user.role not in ['RECEPTIONIST', 'ADMIN'] and not user.is_superuser:
            raise exceptions.PermissionDenied("Only receptionists or admins can check-in patients.")

        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status in [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]:
            return Response({'detail': f"Cannot check in appointment currently marked as {appointment.status}."}, status=status.HTTP_400_BAD_REQUEST)

        old_status = appointment.status
        appointment.status = AppointmentStatus.CHECKED_IN
        appointment.save()

        AppointmentStatusHistory.objects.create(
            appointment=appointment,
            old_status=old_status,
            new_status=AppointmentStatus.CHECKED_IN,
            changed_by=user,
            reason='Patient checked in at reception desk.'
        )

        return Response({'detail': 'Patient checked in successfully.', 'status': AppointmentStatus.CHECKED_IN})

class AppointmentCompleteView(views.APIView):
    """Doctor or Admin marks appointment as completed."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: dict})
    def post(self, request, pk):
        user = request.user
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile') or appointment.doctor_id != user.doctor_profile.id:
                raise exceptions.PermissionDenied("You can only complete appointments assigned to you.")
        elif user.role != 'ADMIN' and not user.is_superuser:
            raise exceptions.PermissionDenied("Only the assigned doctor or administrator can complete an appointment.")

        old_status = appointment.status
        appointment.status = AppointmentStatus.COMPLETED
        appointment.save()

        AppointmentStatusHistory.objects.create(
            appointment=appointment,
            old_status=old_status,
            new_status=AppointmentStatus.COMPLETED,
            changed_by=user,
            reason='Consultation and appointment marked as completed.'
        )

        return Response({'detail': 'Appointment completed successfully.', 'status': AppointmentStatus.COMPLETED})
