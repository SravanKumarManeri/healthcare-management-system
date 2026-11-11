from django.urls import path
from .views import (
    DoctorListView,
    DoctorDetailView,
    DoctorAvailabilitySlotsView,
    DoctorAvailabilityManageView,
    DoctorExceptionManageView
)

urlpatterns = [
    path('', DoctorListView.as_view(), name='doctor-list'),
    path('<int:pk>/', DoctorDetailView.as_view(), name='doctor-detail'),
    path('<int:pk>/availability/', DoctorAvailabilitySlotsView.as_view(), name='doctor-availability-slots'),
    path('<int:pk>/working-hours/', DoctorAvailabilityManageView.as_view(), name='doctor-working-hours'),
    path('<int:pk>/exceptions/', DoctorExceptionManageView.as_view(), name='doctor-exceptions'),
]
