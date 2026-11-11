from django.urls import path
from .views import PrescriptionListCreateView, PrescriptionDetailView

urlpatterns = [
    path('', PrescriptionListCreateView.as_view(), name='prescription-list-create'),
    path('<int:pk>/', PrescriptionDetailView.as_view(), name='prescription-detail'),
]
