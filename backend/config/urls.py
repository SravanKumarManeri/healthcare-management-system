"""
Root URL configuration for Healthcare Management System.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Modular API routes
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/departments/', include('doctors.urls_departments')),
    path('api/doctors/', include('doctors.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/consultations/', include('consultations.urls')),
    path('api/prescriptions/', include('pharmacy.urls_prescriptions')),
    path('api/medicines/', include('pharmacy.urls_medicines')),
    path('api/pharmacy/', include('pharmacy.urls')),
    path('api/dashboards/', include('dashboards.urls')),
]
