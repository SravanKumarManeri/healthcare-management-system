import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const MyPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRx, setSelectedRx] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await pharmacyApi.listPrescriptions();
        setPrescriptions(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve prescription history.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">My Medical Prescriptions</h2>
        <p className="text-muted">Review medication orders issued by your consulting doctors.</p>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner message="Loading your prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          title="No prescriptions on record"
          message="Consultation prescriptions will appear here once issued by your doctor."
          icon="bi-prescription2"
        />
      ) : (
        <div className="row g-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold fs-6 text-primary me-2">Prescription #{rx.id}</span>
                    <small className="text-muted">{new Date(rx.issued_at).toLocaleDateString()}</small>
                  </div>
                  <StatusBadge status={rx.status} />
                </div>
                <div className="card-body p-4">
                  <div className="mb-3 small">
                    <span className="text-muted">Prescribed by:</span> <strong>{rx.doctor_name}</strong>
                  </div>

                  <h6 className="fw-bold small text-uppercase text-secondary mb-2">Prescribed Medications</h6>
                  <div className="list-group list-group-flush border rounded-2 mb-3">
                    {rx.items?.map((item) => (
                      <div key={item.id} className="list-group-item p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <span className="fw-bold text-dark">{item.medicine_name}</span>
                            <span className="badge bg-light text-secondary ms-2 border">{item.medicine_strength}</span>
                            <small className="d-block text-muted mt-1">
                              Instructions: <strong>{item.dosage_instructions}</strong> ({item.frequency})
                            </small>
                            <small className="d-block text-secondary">
                              Duration: {item.duration} &bull; Prescribed Qty: {item.quantity}
                            </small>
                          </div>
                          <span className={`badge ${item.is_fully_dispensed ? 'bg-success' : 'bg-secondary'}`}>
                            {item.dispensed_quantity} / {item.quantity} Dispensed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {rx.notes && (
                    <div className="p-2 bg-light rounded text-muted small">
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Doctor Notes:</strong> {rx.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPrescriptionsPage;
