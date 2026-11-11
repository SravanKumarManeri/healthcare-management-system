import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardsApi, appointmentsApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const PatientDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardsApi.getPatient();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load patient dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading patient portal..." />;

  const { patient_info, metrics, upcoming_appointments, recent_prescriptions } = data || {};

  return (
    <div className="container py-4">
      {/* Welcome & Patient Info Banner */}
      <div className="card shadow-sm border-0 mb-4 rounded-4 bg-primary text-white p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="badge bg-white text-primary mb-2">Patient Portal</span>
            <h2 className="fw-bold mb-1">Welcome, {patient_info?.full_name}</h2>
            <div className="d-flex gap-3 text-white-50 small flex-wrap">
              <span><i className="bi bi-card-heading me-1"></i> Patient ID: <strong className="text-white">{patient_info?.patient_number}</strong></span>
              <span><i className="bi bi-telephone me-1"></i> {patient_info?.phone}</span>
              <span><i className="bi bi-envelope me-1"></i> {patient_info?.email}</span>
            </div>
          </div>
          <div>
            <Link to="/patient/book" className="btn btn-warning text-dark fw-bold px-4 shadow">
              <i className="bi bi-calendar-plus me-1"></i> Book Appointment
            </Link>
          </div>
        </div>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Upcoming Visits</span>
                <h3 className="fw-bold text-primary mb-0 mt-1">{metrics?.upcoming_appointments_count || 0}</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Completed Visits</span>
                <h3 className="fw-bold text-success mb-0 mt-1">{metrics?.past_appointments_count || 0}</h3>
              </div>
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <i className="bi bi-check2-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Active Prescriptions</span>
                <h3 className="fw-bold text-info mb-0 mt-1">{metrics?.prescriptions_count || 0}</h3>
              </div>
              <div className="bg-info-subtle text-info p-3 rounded-circle">
                <i className="bi bi-capsule fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Upcoming Appointments & Prescriptions */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Upcoming Appointments</h5>
              <Link to="/patient/appointments" className="small text-decoration-none">
                View All History
              </Link>
            </div>
            <div className="card-body p-0">
              {upcoming_appointments?.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                  <p>You have no upcoming appointments scheduled.</p>
                  <Link to="/patient/book" className="btn btn-sm btn-outline-primary">
                    Schedule an Appointment
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Date & Time</th>
                        <th>Doctor / Specialty</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming_appointments?.map((apt) => (
                        <tr key={apt.id}>
                          <td>
                            <div className="fw-bold">{apt.appointment_date}</div>
                            <small className="text-muted">{apt.start_time} - {apt.end_time}</small>
                          </td>
                          <td>
                            <div className="fw-semibold text-primary">{apt.doctor_name}</div>
                            <small className="text-muted">{apt.department_name}</small>
                          </td>
                          <td>
                            <StatusBadge status={apt.status} />
                          </td>
                          <td className="text-end">
                            <Link to="/patient/appointments" className="btn btn-sm btn-outline-secondary">
                              Manage
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

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Prescriptions</h5>
              <Link to="/patient/prescriptions" className="small text-decoration-none">
                View Details
              </Link>
            </div>
            <div className="card-body p-0">
              {recent_prescriptions?.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-prescription fs-1 d-block mb-2"></i>
                  <p>No active prescriptions on file.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recent_prescriptions?.map((rx) => (
                    <div key={rx.id} className="list-group-item p-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-dark">Prescription #{rx.id}</span>
                        <StatusBadge status={rx.status} />
                      </div>
                      <small className="text-muted d-block mb-1">
                        Prescribed by <strong>{rx.doctor_name}</strong> on {rx.issued_at}
                      </small>
                      <span className="badge bg-light text-secondary border">
                        {rx.items_count} Medicine Item(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
