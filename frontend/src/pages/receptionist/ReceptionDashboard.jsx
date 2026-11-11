import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardsApi, appointmentsApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const ReceptionDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardsApi.getReception();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load reception dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async (aptId) => {
    setActionLoading(true);
    try {
      await appointmentsApi.checkIn(aptId);
      setSuccess(`Patient checked in for appointment #${aptId}.`);
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check in patient.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading reception desk..." />;

  const { metrics, today_schedule } = data || {};
  const counts = metrics?.today_counts || {};

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Reception Operations Desk</h2>
          <p className="text-muted mb-0">Daily clinic queue, patient arrivals, and appointment coordination.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/reception/patients" className="btn btn-primary fw-semibold">
            <i className="bi bi-person-plus me-1"></i> Register Patient
          </Link>
          <Link to="/reception/appointments" className="btn btn-outline-primary fw-semibold">
            <i className="bi bi-calendar3 me-1"></i> Full Appointments List
          </Link>
        </div>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Today's Visits</span>
                <h3 className="fw-bold text-primary mb-0 mt-1">{counts.total || 0}</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <i className="bi bi-calendar-event fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Booked / Pending</span>
                <h3 className="fw-bold text-info mb-0 mt-1">{counts.booked || 0}</h3>
              </div>
              <div className="bg-info-subtle text-info p-3 rounded-circle">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Checked In / Waiting</span>
                <h3 className="fw-bold text-warning-emphasis mb-0 mt-1">{counts.checked_in || 0}</h3>
              </div>
              <div className="bg-warning-subtle text-warning-emphasis p-3 rounded-circle">
                <i className="bi bi-person-check fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Completed Today</span>
                <h3 className="fw-bold text-success mb-0 mt-1">{counts.completed || 0}</h3>
              </div>
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <i className="bi bi-check-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0 text-dark">
            <i className="bi bi-list-check me-2 text-primary"></i> Today's Appointment Queue
          </h5>
          <span className="badge bg-light text-secondary border">
            {today_schedule?.length || 0} Scheduled Patient(s)
          </span>
        </div>
        <div className="card-body p-0">
          {!today_schedule || today_schedule.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-check fs-1 d-block mb-2"></i>
              <p>No appointments booked for today yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Time</th>
                    <th>Patient Name & ID</th>
                    <th>Doctor & Department</th>
                    <th>Status</th>
                    <th className="text-end">Front-Desk Action</th>
                  </tr>
                </thead>
                <tbody>
                  {today_schedule.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-bold text-primary">
                        {item.start_time} - {item.end_time}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{item.patient_name}</div>
                        <small className="text-muted">{item.patient_number}</small>
                      </td>
                      <td>
                        <div className="fw-semibold">{item.doctor_name}</div>
                        <small className="text-muted">{item.department_name}</small>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="text-end">
                        {item.status === 'BOOKED' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success fw-semibold"
                            onClick={() => handleCheckIn(item.id)}
                            disabled={actionLoading}
                          >
                            <i className="bi bi-box-arrow-in-right me-1"></i> Check In
                          </button>
                        )}
                        {item.status === 'CHECKED_IN' && (
                          <span className="badge bg-warning text-dark">Waiting for Doctor</span>
                        )}
                        {item.status === 'COMPLETED' && (
                          <span className="text-success small fw-semibold"><i className="bi bi-check2"></i> Finished</span>
                        )}
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
  );
};

export default ReceptionDashboard;
