from django.urls import path
from .views import (
    AppointmentListCreateView,
    AppointmentDetailView,
    AppointmentRescheduleView,
    AppointmentCancelView,
    AppointmentCheckInView,
    AppointmentCompleteView
)

urlpatterns = [
    path('', AppointmentListCreateView.as_view(), name='appointment-list-create'),
    path('<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('<int:pk>/reschedule/', AppointmentRescheduleView.as_view(), name='appointment-reschedule'),
    path('<int:pk>/cancel/', AppointmentCancelView.as_view(), name='appointment-cancel'),
    path('<int:pk>/check-in/', AppointmentCheckInView.as_view(), name='appointment-checkin'),
    path('<int:pk>/complete/', AppointmentCompleteView.as_view(), name='appointment-complete'),
]
