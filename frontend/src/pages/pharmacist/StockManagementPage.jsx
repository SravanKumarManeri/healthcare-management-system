import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';

export const StockManagementPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Receive Stock Modal State
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receiveData, setReceiveData] = useState({
    medicine_id: '',
    batch_number: '',
    expiry_date: '',
    quantity: 100,
    reference: '',
  });

  // Adjust Stock Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    medicine_id: '',
    batch_id: '',
    quantity_delta: 0,
    reason: 'Inventory physical count reconciliation',
  });
  const [selectedMedBatches, setSelectedMedBatches] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medRes, movRes] = await Promise.all([
        pharmacyApi.listMedicines({ is_active: true }),
        pharmacyApi.getMovements()
      ]);
      setMedicines(medRes.data.results || medRes.data || []);
      setMovements(movRes.data.results || movRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stock movements and inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await pharmacyApi.receiveStock({
        medicine_id: parseInt(receiveData.medicine_id, 10),
        batch_number: receiveData.batch_number,
        expiry_date: receiveData.expiry_date,
        quantity: parseInt(receiveData.quantity, 10),
        reference: receiveData.reference,
      });
      setSuccess("Stock batch received and recorded successfully!");
      setIsReceiveOpen(false);
      setReceiveData({
        medicine_id: '', batch_number: '', expiry_date: '', quantity: 100, reference: ''
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.expiry_date?.[0] || err.response?.data?.detail || 'Stock receipt failed.');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await pharmacyApi.adjustStock({
        medicine_id: parseInt(adjustData.medicine_id, 10),
        batch_id: adjustData.batch_id ? parseInt(adjustData.batch_id, 10) : null,
        quantity_delta: parseInt(adjustData.quantity_delta, 10),
        reason: adjustData.reason,
      });
      setSuccess("Inventory stock adjusted successfully!");
      setIsAdjustOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Stock adjustment rejected.');
    }
  };

  const onAdjustMedSelect = (medId) => {
    setAdjustData({ ...adjustData, medicine_id: medId, batch_id: '' });
    const med = medicines.find((m) => String(m.id) === String(medId));
    setSelectedMedBatches(med?.batches || []);
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Pharmacy Stock & Movements</h2>
          <p className="text-muted mb-0">Record incoming supplier batches, adjust count discrepancies, and audit movements.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary fw-semibold"
            onClick={() => setIsReceiveOpen(true)}
          >
            <i className="bi bi-box-arrow-in-down me-1"></i> Receive Stock
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary fw-semibold"
            onClick={() => setIsAdjustOpen(true)}
          >
            <i className="bi bi-sliders me-1"></i> Adjust Stock
          </button>
        </div>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Movements Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0 text-dark">
            <i className="bi bi-clock-history me-2 text-primary"></i> Stock Movement Audit Log
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner message="Loading audit history..." />
          ) : movements.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>No stock movement entries recorded.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Timestamp</th>
                    <th>Medicine</th>
                    <th>Batch #</th>
                    <th>Movement Type</th>
                    <th>Quantity Delta</th>
                    <th>Reference / Reason</th>
                    <th>Staff Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov) => (
                    <tr key={mov.id}>
                      <td className="small text-muted">{new Date(mov.created_at).toLocaleString()}</td>
                      <td className="fw-semibold text-dark">{mov.medicine_name}</td>
                      <td className="font-monospace small">{mov.batch_number || 'N/A'}</td>
                      <td>
                        <span className={`badge ${
                          mov.movement_type === 'RECEIVED' ? 'bg-success' :
                          mov.movement_type === 'DISPENSED' ? 'bg-info' : 'bg-secondary'
                        }`}>
                          {mov.movement_type}
                        </span>
                      </td>
                      <td className="fw-bold">
                        <span className={mov.quantity_delta > 0 ? 'text-success' : 'text-danger'}>
                          {mov.quantity_delta > 0 ? `+${mov.quantity_delta}` : mov.quantity_delta}
                        </span>
                      </td>
                      <td>
                        <div className="small text-dark">{mov.reason}</div>
                        {mov.reference && <small className="text-muted">{mov.reference}</small>}
                      </td>
                      <td className="small text-secondary">{mov.performed_by_username || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Receive Stock Modal */}
      {isReceiveOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Receive New Stock Batch</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsReceiveOpen(false)}></button>
              </div>
              <form onSubmit={handleReceiveStock}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Medicine *</label>
                      <select
                        className="form-select"
                        value={receiveData.medicine_id}
                        onChange={(e) => setReceiveData({ ...receiveData, medicine_id: e.target.value })}
                        required
                      >
                        <option value="">-- Select Medicine --</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Batch Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={receiveData.batch_number}
                        onChange={(e) => setReceiveData({ ...receiveData, batch_number: e.target.value })}
                        placeholder="e.g. BCH-AMX-2026-01"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Expiry Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={receiveData.expiry_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setReceiveData({ ...receiveData, expiry_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Quantity Received *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={receiveData.quantity}
                        onChange={(e) => setReceiveData({ ...receiveData, quantity: e.target.value })}
                        min="1"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">PO / Invoice Reference</label>
                      <input
                        type="text"
                        className="form-control"
                        value={receiveData.reference}
                        onChange={(e) => setReceiveData({ ...receiveData, reference: e.target.value })}
                        placeholder="e.g. PO-2026-091"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsReceiveOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    Confirm Stock Receipt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-secondary text-white">
                <h5 className="modal-title fw-bold">Manual Inventory Adjustment</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsAdjustOpen(false)}></button>
              </div>
              <form onSubmit={handleAdjustStock}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Medicine *</label>
                      <select
                        className="form-select"
                        value={adjustData.medicine_id}
                        onChange={(e) => onAdjustMedSelect(e.target.value)}
                        required
                      >
                        <option value="">-- Select Medicine --</option>
                        {medicines.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Specific Batch *</label>
                      <select
                        className="form-select"
                        value={adjustData.batch_id}
                        onChange={(e) => setAdjustData({ ...adjustData, batch_id: e.target.value })}
                        required
                      >
                        <option value="">-- Select Batch --</option>
                        {selectedMedBatches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batch_number} (Exp: {b.expiry_date}, Avail: {b.available_quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Quantity Delta (Negative for deduction, Positive for addition) *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={adjustData.quantity_delta}
                        onChange={(e) => setAdjustData({ ...adjustData, quantity_delta: e.target.value })}
                        placeholder="-5 or 10"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Reason for Adjustment *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={adjustData.reason}
                        onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                        placeholder="e.g. Expired batch write-off, damaged pack"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={adjustData.quantity_delta === 0}>
                    Save Stock Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagementPage;
