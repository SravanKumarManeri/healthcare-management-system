from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser))

class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCTOR')

class IsReceptionist(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'RECEPTIONIST')

class IsPharmacist(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PHARMACIST')

class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PATIENT')

class IsAdminOrDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role in ['ADMIN', 'DOCTOR'] or request.user.is_superuser))

class IsAdminOrReceptionist(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role in ['ADMIN', 'RECEPTIONIST'] or request.user.is_superuser))

class IsAdminOrPharmacist(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role in ['ADMIN', 'PHARMACIST'] or request.user.is_superuser))

class IsClinicalStaff(permissions.BasePermission):
    """Admin, Doctor, or Receptionist (for non-clinical scheduling views)"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role in ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] or request.user.is_superuser))
