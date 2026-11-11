from datetime import date, timedelta
from rest_framework import generics, status, views, exceptions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.db.models import Sum, F, Q
from drf_spectacular.utils import extend_schema

from accounts.permissions import IsAdminOrPharmacist, IsDoctor, IsAdmin
from .models import (
    Medicine,
    MedicineBatch,
    StockMovement,
    Prescription,
    PrescriptionItem,
    DispensingRecord,
    PrescriptionStatus,
    MovementType
)
from .serializers import (
    MedicineSerializer,
    MedicineBatchSerializer,
    StockReceiptSerializer,
    StockAdjustmentSerializer,
    PrescriptionSerializer,
    PrescriptionCreateSerializer,
    StockMovementSerializer
)

class MedicineListCreateView(generics.ListCreateAPIView):
    """List medicine catalogue or add new medicine (Pharmacist / Admin)."""
    permission_classes = [IsAuthenticated]
    serializer_class = MedicineSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['dosage_form', 'is_active']
    search_fields = ['name', 'generic_name', 'sku', 'manufacturer']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        return Medicine.objects.prefetch_related('batches').all()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['ADMIN', 'PHARMACIST'] and not user.is_superuser:
            raise exceptions.PermissionDenied("Only pharmacists and administrators can create medicine entries.")
        serializer.save()

class MedicineDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update medicine catalogue entry."""
    permission_classes = [IsAuthenticated]
    serializer_class = MedicineSerializer
    queryset = Medicine.objects.prefetch_related('batches').all()

    def perform_update(self, serializer):
        user = self.request.user
        if user.role not in ['ADMIN', 'PHARMACIST'] and not user.is_superuser:
            raise exceptions.PermissionDenied("Only pharmacists or administrators can edit medicine details.")
        serializer.save()

class StockReceiveView(views.APIView):
    """Receive new inventory batch for a medicine and record stock movement."""
    permission_classes = [IsAdminOrPharmacist]

    @extend_schema(request=StockReceiptSerializer, responses={201: dict})
    def post(self, request):
        serializer = StockReceiptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            medicine = Medicine.objects.get(pk=data['medicine_id'])
        except Medicine.DoesNotExist:
            return Response({'detail': 'Medicine not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            batch, created = MedicineBatch.objects.get_or_create(
                medicine=medicine,
                batch_number=data['batch_number'],
                defaults={
                    'expiry_date': data['expiry_date'],
                    'quantity_received': data['quantity'],
                    'available_quantity': data['quantity']
                }
            )
            if not created:
                batch.quantity_received += data['quantity']
                batch.available_quantity += data['quantity']
                batch.expiry_date = data['expiry_date']
                batch.save()

            StockMovement.objects.create(
                medicine=medicine,
                batch=batch,
                movement_type=MovementType.RECEIVED,
                quantity_delta=data['quantity'],
                reason=f"Stock received. Batch: {batch.batch_number}",
                reference=data.get('reference', ''),
                performed_by=request.user
            )

        return Response({
            'detail': 'Stock received successfully.',
            'batch_id': batch.id,
            'batch_number': batch.batch_number,
            'available_quantity': batch.available_quantity
        }, status=status.HTTP_201_CREATED)

class StockAdjustmentView(views.APIView):
    """Adjust stock quantity for damages, losses, or manual inventory counts."""
    permission_classes = [IsAdminOrPharmacist]

    @extend_schema(request=StockAdjustmentSerializer, responses={200: dict})
    def post(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            medicine = Medicine.objects.get(pk=data['medicine_id'])
        except Medicine.DoesNotExist:
            return Response({'detail': 'Medicine not found.'}, status=status.HTTP_404_NOT_FOUND)

        batch_id = data.get('batch_id')
        delta = data['quantity_delta']
        reason = data['reason']

        with transaction.atomic():
            batch = None
            if batch_id:
                try:
                    batch = MedicineBatch.objects.select_for_update().get(pk=batch_id, medicine=medicine)
                except MedicineBatch.DoesNotExist:
                    return Response({'detail': 'Specified batch does not belong to this medicine.'}, status=status.HTTP_400_BAD_REQUEST)

                if batch.available_quantity + delta < 0:
                    return Response({
                        'detail': f'Cannot deduct {abs(delta)} units; available stock is only {batch.available_quantity}.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                batch.available_quantity += delta
                batch.save()

            StockMovement.objects.create(
                medicine=medicine,
                batch=batch,
                movement_type=MovementType.ADJUSTMENT,
                quantity_delta=delta,
                reason=reason,
                performed_by=request.user
            )

        return Response({
            'detail': 'Stock adjusted successfully.',
            'medicine': medicine.name,
            'quantity_delta': delta
        }, status=status.HTTP_200_OK)

class LowStockAlertView(views.APIView):
    """
    Returns inventory items requiring attention:
    1. Low-stock medicines (total available <= reorder level)
    2. Expired batches
    3. Batches near expiry (within 30 days)
    """
    permission_classes = [IsAdminOrPharmacist]

    @extend_schema(responses={200: dict})
    def get(self, request):
        today = date.today()
        near_expiry_threshold = today + timedelta(days=30)

        # 1. Low stock medicines
        all_medicines = Medicine.objects.prefetch_related('batches').filter(is_active=True)
        low_stock_medicines = [
            {
                'id': m.id,
                'name': m.name,
                'strength': m.strength,
                'sku': m.sku,
                'reorder_level': m.reorder_level,
                'total_stock': m.total_stock,
            }
            for m in all_medicines if m.is_low_stock
        ]

        # 2. Expired batches
        expired_batches = MedicineBatch.objects.select_related('medicine').filter(
            expiry_date__lt=today,
            available_quantity__gt=0
        ).values(
            'id', 'medicine__id', 'medicine__name', 'batch_number', 'expiry_date', 'available_quantity'
        )

        # 3. Near expiry batches
        near_expiry_batches = MedicineBatch.objects.select_related('medicine').filter(
            expiry_date__gte=today,
            expiry_date__lte=near_expiry_threshold,
            available_quantity__gt=0
        ).values(
            'id', 'medicine__id', 'medicine__name', 'batch_number', 'expiry_date', 'available_quantity'
        )

        return Response({
            'low_stock_count': len(low_stock_medicines),
            'low_stock_items': low_stock_medicines,
            'expired_batches_count': len(expired_batches),
            'expired_batches': list(expired_batches),
            'near_expiry_batches_count': len(near_expiry_batches),
            'near_expiry_batches': list(near_expiry_batches),
        })

class PrescriptionListCreateView(generics.ListCreateAPIView):
    """
    List prescriptions (role-scoped) or issue a new prescription (Doctor only).
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'patient', 'doctor']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__patient_number', 'doctor__user__first_name']
    ordering_fields = ['issued_at', 'created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Prescription.objects.none()
        user = self.request.user
        qs = Prescription.objects.select_related('patient', 'doctor', 'doctor__user').prefetch_related(
            'items__medicine', 'items__dispensing_records__medicine_batch'
        )

        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile'):
                return Prescription.objects.none()
            return qs.filter(patient=user.patient_profile)
        elif user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile'):
                return Prescription.objects.none()
            return qs.filter(doctor=user.doctor_profile)
        elif user.role in ['PHARMACIST', 'ADMIN'] or user.is_superuser:
            return qs.all().order_by('-issued_at')
        else:
            raise exceptions.PermissionDenied("Not authorized to view prescriptions.")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'DOCTOR' and not (user.role == 'ADMIN' or user.is_superuser):
            raise exceptions.PermissionDenied("Only authorized doctors may write prescriptions.")
        serializer.save()

class PrescriptionDetailView(generics.RetrieveAPIView):
    """View details of a specific prescription."""
    permission_classes = [IsAuthenticated]
    serializer_class = PrescriptionSerializer
    queryset = Prescription.objects.select_related('patient', 'doctor').prefetch_related(
        'items__medicine', 'items__dispensing_records__medicine_batch'
    )

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        if user.role == 'PATIENT':
            if not hasattr(user, 'patient_profile') or obj.patient_id != user.patient_profile.id:
                raise exceptions.PermissionDenied("You do not have permission to view this prescription.")
        elif user.role == 'DOCTOR':
            if not hasattr(user, 'doctor_profile') or obj.doctor_id != user.doctor_profile.id:
                raise exceptions.PermissionDenied("You are not the prescribing doctor.")
        elif user.role not in ['PHARMACIST', 'ADMIN'] and not user.is_superuser:
            raise exceptions.PermissionDenied("Unauthorized.")

        return obj

class PrescriptionDispenseView(views.APIView):
    """
    Dispense medicine items for a prescription.
    Uses First-Expiry-First-Out (FEFO) batch allocation, prevents dispensing expired stock,
    and guarantees transactional atomicity.
    """
    permission_classes = [IsAdminOrPharmacist]

    @extend_schema(request=None, responses={200: dict})
    def post(self, request, pk):
        try:
            prescription = Prescription.objects.prefetch_related('items__medicine').get(pk=pk)
        except Prescription.DoesNotExist:
            return Response({'detail': 'Prescription not found.'}, status=status.HTTP_404_NOT_FOUND)

        if prescription.status == PrescriptionStatus.CANCELLED:
            return Response({'detail': 'Cannot dispense a cancelled prescription.'}, status=status.HTTP_400_BAD_REQUEST)
        if prescription.status == PrescriptionStatus.DISPENSED:
            return Response({'detail': 'Prescription has already been fully dispensed.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        dispensed_details = []

        with transaction.atomic():
            for item in prescription.items.all():
                needed = item.remaining_quantity
                if needed <= 0:
                    continue

                # Query non-expired batches for this medicine ordered by expiry date (FEFO)
                valid_batches = MedicineBatch.objects.select_for_update().filter(
                    medicine=item.medicine,
                    expiry_date__gte=today,
                    available_quantity__gt=0
                ).order_by('expiry_date')

                total_available = sum(b.available_quantity for b in valid_batches)
                if total_available < needed:
                    return Response({
                        'detail': (
                            f"Insufficient non-expired stock for '{item.medicine.name}'. "
                            f"Required: {needed}, Available: {total_available}."
                        )
                    }, status=status.HTTP_400_BAD_REQUEST)

                qty_to_fill = needed
                for batch in valid_batches:
                    if qty_to_fill <= 0:
                        break

                    disp_qty = min(qty_to_fill, batch.available_quantity)
                    batch.available_quantity -= disp_qty
                    batch.save()

                    DispensingRecord.objects.create(
                        prescription_item=item,
                        medicine_batch=batch,
                        quantity_dispensed=disp_qty,
                        dispensed_by=request.user
                    )

                    StockMovement.objects.create(
                        medicine=item.medicine,
                        batch=batch,
                        movement_type=MovementType.DISPENSED,
                        quantity_delta=-disp_qty,
                        reason=f"Dispensed for Prescription #{prescription.id}",
                        reference=f"RX-{prescription.id}",
                        performed_by=request.user
                    )

                    item.dispensed_quantity += disp_qty
                    qty_to_fill -= disp_qty

                    dispensed_details.append({
                        'medicine': item.medicine.name,
                        'batch': batch.batch_number,
                        'quantity': disp_qty
                    })

                item.save()

            # Refresh and determine new status
            all_items = prescription.items.all()
            all_done = all(it.is_fully_dispensed for it in all_items)
            any_done = any(it.dispensed_quantity > 0 for it in all_items)

            if all_done:
                prescription.status = PrescriptionStatus.DISPENSED
            elif any_done:
                prescription.status = PrescriptionStatus.PARTIALLY_DISPENSED
            prescription.save()

        return Response({
            'detail': 'Prescription dispensed successfully.',
            'prescription_id': prescription.id,
            'status': prescription.status,
            'dispensed_items': dispensed_details
        }, status=status.HTTP_200_OK)

class StockMovementListView(generics.ListAPIView):
    """Audit log of all stock movements (received, dispensed, adjusted)."""
    permission_classes = [IsAdminOrPharmacist]
    serializer_class = StockMovementSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['movement_type', 'medicine', 'performed_by']
    search_fields = ['medicine__name', 'batch__batch_number', 'reason', 'reference']
    ordering_fields = ['created_at']

    def get_queryset(self):
        return StockMovement.objects.select_related('medicine', 'batch', 'performed_by').all()
