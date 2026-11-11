from django.urls import path
from .views import (
    AdminDashboardView,
    DoctorDashboardView,
    ReceptionDashboardView,
    PharmacyDashboardView,
    PatientDashboardView
)

urlpatterns = [
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('doctor/', DoctorDashboardView.as_view(), name='dashboard-doctor'),
    path('reception/', ReceptionDashboardView.as_view(), name='dashboard-reception'),
    path('pharmacy/', PharmacyDashboardView.as_view(), name='dashboard-pharmacy'),
    path('patient/', PatientDashboardView.as_view(), name='dashboard-patient'),
]
