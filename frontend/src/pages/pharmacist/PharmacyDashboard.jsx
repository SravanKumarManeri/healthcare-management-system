import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardsApi, pharmacyApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const PharmacyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardsApi.getPharmacy();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load pharmacy dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading pharmacy dispensary..." />;

  const { metrics, pending_prescriptions, low_stock_items, recent_movements } = data || {};

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Pharmacy & Inventory Oversight</h2>
          <p className="text-muted mb-0">Dispensing queue, batch expiry tracking, and stock management.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/pharmacy/dispense" className="btn btn-primary fw-semibold">
            <i className="bi bi-prescription2 me-1"></i> Dispense Prescriptions
          </Link>
          <Link to="/pharmacy/stock" className="btn btn-outline-primary fw-semibold">
            <i className="bi bi-box-arrow-in-down me-1"></i> Receive Stock
          </Link>
        </div>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Pending Dispense</span>
                <h3 className="fw-bold text-warning-emphasis mb-0 mt-1">{metrics?.pending_prescriptions_count || 0}</h3>
              </div>
              <div className="bg-warning-subtle text-warning-emphasis p-3 rounded-circle">
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Low Stock Alert</span>
                <h3 className="fw-bold text-danger mb-0 mt-1">{metrics?.low_stock_count || 0}</h3>
              </div>
              <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                <i className="bi bi-exclamation-triangle fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Near Expiry (&le;30d)</span>
                <h3 className="fw-bold text-info mb-0 mt-1">{metrics?.near_expiry_batches_count || 0}</h3>
              </div>
              <div className="bg-info-subtle text-info p-3 rounded-circle">
                <i className="bi bi-calendar-range fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Expired Batches</span>
                <h3 className="fw-bold text-secondary mb-0 mt-1">{metrics?.expired_batches_count || 0}</h3>
              </div>
              <div className="bg-light text-secondary p-3 rounded-circle border">
                <i className="bi bi-slash-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Prescriptions Awaiting Dispensing */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-prescription2 me-2 text-primary"></i> Prescriptions Awaiting Dispensing
              </h5>
              <Link to="/pharmacy/dispense" className="small text-decoration-none">
                Open Queue
              </Link>
            </div>
            <div className="card-body p-0">
              {!pending_prescriptions || pending_prescriptions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-check-all fs-1 d-block mb-2 text-success"></i>
                  <p>All prescription orders are currently filled and dispensed.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Rx #</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Items</th>
                        <th>Issued</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending_prescriptions.map((rx) => (
                        <tr key={rx.id}>
                          <td className="fw-bold text-primary">#{rx.id}</td>
                          <td>
                            <div className="fw-semibold text-dark">{rx.patient_name}</div>
                            <small className="text-muted">{rx.patient_number}</small>
                          </td>
                          <td className="small text-secondary">{rx.doctor_name}</td>
                          <td><span className="badge bg-secondary">{rx.items_count} Meds</span></td>
                          <td className="small text-muted">{rx.issued_at}</td>
                          <td className="text-end">
                            <Link to={`/pharmacy/dispense?rxId=${rx.id}`} className="btn btn-sm btn-primary">
                              Dispense
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts & Recent Movements */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0 text-danger">
                <i className="bi bi-exclamation-octagon me-2"></i> Low-Stock Medicines
              </h5>
            </div>
            <div className="card-body p-0">
              {!low_stock_items || low_stock_items.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  All active medicine stocks are above their reorder thresholds.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {low_stock_items.map((m) => (
                    <div key={m.id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                      <div>
                        <strong>{m.name}</strong>
                        <small className="d-block text-muted">{m.sku} &bull; Reorder Level: {m.reorder_level}</small>
                      </div>
                      <span className="badge bg-danger fs-6">{m.total_stock} units left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-activity me-2 text-info"></i> Recent Stock Activity
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush small">
                {recent_movements?.map((mov) => (
                  <div key={mov.id} className="list-group-item d-flex justify-content-between align-items-center p-2 px-3">
                    <div>
                      <strong>{mov.medicine__name}</strong>
                      <span className="text-muted ms-1">({mov.movement_type})</span>
                    </div>
                    <span className={`badge ${mov.quantity_delta > 0 ? 'bg-success' : 'bg-secondary'}`}>
                      {mov.quantity_delta > 0 ? `+${mov.quantity_delta}` : mov.quantity_delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
