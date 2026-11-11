from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    StaffUserCreateSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer
)
from .permissions import IsAdmin

User = get_user_model()

class PatientRegisterView(generics.CreateAPIView):
    """Public registration for patient accounts. Creates user and linked patient profile."""
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    @extend_schema(summary="Patient self-registration", responses={201: UserSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Retrieve or update profile details of currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

class ChangePasswordView(views.APIView):
    """Change password for currently authenticated user."""
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, responses={200: dict})
    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)

class UserListView(generics.ListCreateAPIView):
    """Admin-only management of system users and staff accounts."""
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['id', 'username', 'created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StaffUserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.all().order_by('-id')

class UserDetailView(generics.RetrieveUpdateAPIView):
    """Admin-only detail and activation/deactivation endpoint for users."""
    permission_classes = [IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_destroy(self, instance):
        # Soft delete by deactivating
        instance.is_active = False
        instance.save()
