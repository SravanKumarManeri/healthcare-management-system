import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pharmacyApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const PrescriptionDispensingPage = () => {
  const [searchParams] = useSearchParams();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Dispense Modal State
  const [activeRx, setActiveRx] = useState(null);
  const [dispenseLoading, setDispenseLoading] = useState(false);
  const [dispenseResult, setDispenseResult] = useState(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await pharmacyApi.listPrescriptions();
      const list = res.data.results || res.data || [];
      setPrescriptions(list);

      const urlRxId = searchParams.get('rxId');
      if (urlRxId) {
        const found = list.find((p) => String(p.id) === String(urlRxId));
        if (found) {
          openDispenseModal(found);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch prescription queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const openDispenseModal = async (rx) => {
    setActiveRx(rx);
    setDispenseResult(null);
    setError('');
  };

  const handleExecuteDispense = async () => {
    if (!activeRx) return;
    setDispenseLoading(true);
    setError('');
    try {
      const res = await pharmacyApi.dispensePrescription(activeRx.id);
      setDispenseResult(res.data);
      setSuccess(`Prescription #${activeRx.id} dispensed successfully using FEFO inventory allocation!`);
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to dispense prescription. Check inventory levels.');
    } finally {
      setDispenseLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Prescription Dispensing Queue</h2>
          <p className="text-muted mb-0">Fill outpatient prescriptions with automated FEFO batch allocation and inventory safety checks.</p>
        </div>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {loading ? (
        <LoadingSpinner message="Loading dispensing queue..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          title="No pending prescriptions"
          message="There are no prescriptions waiting to be dispensed."
          icon="bi-prescription"
        />
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Prescription #</th>
                  <th>Patient Name & ID</th>
                  <th>Doctor</th>
                  <th>Issued Date</th>
                  <th>Items Count</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => {
                  const isEligible = ['ISSUED', 'PARTIALLY_DISPENSED'].includes(rx.status);
                  return (
                    <tr key={rx.id}>
                      <td className="fw-bold text-primary font-monospace">#{rx.id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{rx.patient_name}</div>
                        <small className="text-muted">{rx.patient_number}</small>
                      </td>
                      <td className="fw-semibold text-secondary">{rx.doctor_name}</td>
                      <td className="small text-muted">{new Date(rx.issued_at).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {rx.items?.length || 0} Medicine(s)
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={rx.status} />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className={`btn btn-sm ${isEligible ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => openDispenseModal(rx)}
                        >
                          <i className="bi bi-prescription2 me-1"></i>
                          {isEligible ? 'Dispense Order' : 'View Dispensed'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {activeRx && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-capsule me-2"></i> Dispense Prescription #{activeRx.id}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveRx(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-2 mb-3 bg-light p-3 rounded">
                  <div className="col-md-6">
                    <span className="text-muted small d-block">Patient:</span>
                    <strong>{activeRx.patient_name}</strong> ({activeRx.patient_number})
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted small d-block">Doctor:</span>
                    <strong>{activeRx.doctor_name}</strong>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-2">Prescribed Items</h6>
                <div className="table-responsive border rounded-3 mb-4">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Medicine</th>
                        <th>Instructions</th>
                        <th>Qty Needed</th>
                        <th>Already Dispensed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRx.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.medicine_name} ({item.medicine_strength})</td>
                          <td className="small">{item.dosage_instructions} &bull; {item.frequency}</td>
                          <td><span className="badge bg-secondary">{item.quantity}</span></td>
                          <td>
                            <span className={item.is_fully_dispensed ? 'text-success fw-bold' : 'text-muted'}>
                              {item.dispensed_quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Dispense Result Feedback */}
                {dispenseResult && (
                  <div className="alert alert-success">
                    <h6 className="fw-bold mb-2"><i className="bi bi-check-circle-fill me-1"></i> Dispensing Completed!</h6>
                    <p className="small mb-2">The following inventory batches were automatically allocated via FEFO:</p>
                    <ul className="mb-0 small">
                      {dispenseResult.dispensed_items?.map((d, i) => (
                        <li key={i}>
                          <strong>{d.medicine}:</strong> {d.quantity} units from Batch <code>{d.batch}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveRx(null)}>
                  Close
                </button>
                {['ISSUED', 'PARTIALLY_DISPENSED'].includes(activeRx.status) && !dispenseResult && (
                  <button
                    type="button"
                    className="btn btn-success fw-bold px-4"
                    disabled={dispenseLoading}
                    onClick={handleExecuteDispense}
                  >
                    {dispenseLoading ? 'Dispensing...' : 'Execute FEFO Dispense'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDispensingPage;
