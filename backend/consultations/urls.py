from django.urls import path
from .views import ConsultationListCreateView, ConsultationDetailView

urlpatterns = [
    path('', ConsultationListCreateView.as_view(), name='consultation-list-create'),
    path('<int:pk>/', ConsultationDetailView.as_view(), name='consultation-detail'),
]
