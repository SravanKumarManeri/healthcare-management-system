from rest_framework import generics, status, exceptions
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsAdminOrReceptionist
from .models import PatientProfile
from .serializers import (
    PatientProfileSerializer,
    PatientCreateSerializer,
    PatientSummarySerializer
)

class PatientListCreateView(generics.ListCreateAPIView):
    """
    List and search patients, or register a new patient via Receptionist/Admin.
    Patients querying this endpoint only see their own profile.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['gender', 'blood_group']
    search_fields = ['patient_number', 'first_name', 'last_name', 'phone', 'email']
    ordering_fields = ['created_at', 'last_name', 'patient_number']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientCreateSerializer
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and user.role in ['RECEPTIONIST', 'ADMIN', 'DOCTOR']:
            return PatientProfileSerializer
        return PatientSummarySerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return PatientProfile.objects.none()
        user = self.request.user
        if user.role == 'PATIENT':
            return PatientProfile.objects.filter(user=user)
        # Staff roles (ADMIN, RECEPTIONIST, DOCTOR, PHARMACIST) can search patients
        return PatientProfile.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['ADMIN', 'RECEPTIONIST'] and not user.is_superuser:
            raise exceptions.PermissionDenied("Only receptionists or administrators can register patients directly.")
        serializer.save()

class PatientDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a patient's profile with strict role-based access checks.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PatientProfileSerializer
    queryset = PatientProfile.objects.all()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        if user.role == 'PATIENT':
            if obj.user_id != user.id:
                raise exceptions.PermissionDenied("You do not have permission to access another patient's records.")
        return obj

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        if user.role == 'PATIENT':
            # Patients can only update their own contact details and emergency contacts
            allowed_fields = {'phone', 'email', 'address', 'emergency_contact_name', 'emergency_contact_phone'}
            for field in serializer.validated_data.keys():
                if field not in allowed_fields:
                    raise exceptions.PermissionDenied(f"Patients are not permitted to modify '{field}'.")
        elif user.role not in ['ADMIN', 'RECEPTIONIST'] and not user.is_superuser:
            raise exceptions.PermissionDenied("Only receptionists and administrators can edit patient profiles.")

        serializer.save()
