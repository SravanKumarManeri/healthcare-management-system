from django.urls import path
from .views import (
    StockReceiveView,
    StockAdjustmentView,
    LowStockAlertView,
    PrescriptionDispenseView,
    StockMovementListView
)

urlpatterns = [
    path('low-stock/', LowStockAlertView.as_view(), name='pharmacy-low-stock'),
    path('stock/receive/', StockReceiveView.as_view(), name='pharmacy-stock-receive'),
    path('stock/adjust/', StockAdjustmentView.as_view(), name='pharmacy-stock-adjust'),
    path('prescriptions/<int:pk>/dispense/', PrescriptionDispenseView.as_view(), name='pharmacy-dispense'),
    path('movements/', StockMovementListView.as_view(), name='pharmacy-movements'),
]
