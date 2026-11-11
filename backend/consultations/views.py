from rest_framework import generics, exceptions
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import Consultation
from .serializers import ConsultationSerializer

class ConsultationListCreateView(generics.ListCreateAPIView):
    """List clinical consultations (role-scoped) or create a new consultation note (Doctor only)."""
    permission_classes = [IsAuthenticated]
    serializer_class = ConsultationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['appointment', 'doctor', 'patient', 'status']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__patient_number', 'diagnosis', 'symptoms_or_history']
    ordering_fields = ['created_at', 'follow_up_date']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Consultation.objects.none()
        user = self.request.user
        qs = Consultation.objects.select_related('appointment', 'patient', 'doctor', 'doctor__user').all()

        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile'):
                return Consultation.objects.none()
            return qs.filter(patient=user.patient_profile, status='FINAL')
        elif user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile'):
                return Consultation.objects.none()
            return qs.filter(doctor=user.doctor_profile)
        elif user.role == 'ADMIN' or user.is_superuser:
            return qs
        else:
            # Receptionists & Pharmacists have restricted access to raw clinical notes
            raise exceptions.PermissionDenied("Staff role not authorized to view raw clinical notes.")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'DOCTOR' and not (user.role == 'ADMIN' or user.is_superuser):
            raise exceptions.PermissionDenied("Only authorized doctors can enter consultation notes.")
        serializer.save()

class ConsultationDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a consultation record."""
    permission_classes = [IsAuthenticated]
    serializer_class = ConsultationSerializer
    queryset = Consultation.objects.all()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile') or obj.patient_id != user.patient_profile.id:
                raise exceptions.PermissionDenied("You do not have permission to view this record.")
        elif user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile') or obj.doctor_id != user.doctor_profile.id:
                raise exceptions.PermissionDenied("You are not the doctor for this consultation.")
        elif not (user.role == 'ADMIN' or user.is_superuser):
            raise exceptions.PermissionDenied("Unauthorized to access clinical record.")

        return obj

    def perform_update(self, serializer):
        user = self.request.user
        obj = self.get_object()

        if user.role == 'DOCTOR':
            if obj.doctor.user_id != user.id:
                raise exceptions.PermissionDenied("You can only modify your own consultation notes.")
        elif not (user.role == 'ADMIN' or user.is_superuser):
            raise exceptions.PermissionDenied("Only the consulting doctor or administrator may update notes.")

        serializer.save()
