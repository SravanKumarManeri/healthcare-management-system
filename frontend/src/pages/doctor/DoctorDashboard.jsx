import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardsApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const DoctorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardsApi.getDoctor();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load doctor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading doctor dashboard..." />;

  const { metrics, today_appointments } = data || {};

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Doctor's Clinical Hub</h2>
          <p className="text-muted mb-0">Today's appointments, assigned patient records, and consultation entries.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/doctor/appointments" className="btn btn-primary fw-semibold">
            <i className="bi bi-journal-medical me-1"></i> Patient Consultations
          </Link>
          <Link to="/doctor/schedule" className="btn btn-outline-primary fw-semibold">
            <i className="bi bi-clock-history me-1"></i> Availability & Hours
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
                <span className="text-muted small fw-semibold text-uppercase">Today's Patients</span>
                <h3 className="fw-bold text-primary mb-0 mt-1">{metrics?.today_appointments_count || 0}</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <i className="bi bi-person-lines-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Upcoming Visits</span>
                <h3 className="fw-bold text-info mb-0 mt-1">{metrics?.upcoming_appointments_count || 0}</h3>
              </div>
              <div className="bg-info-subtle text-info p-3 rounded-circle">
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Completed Consultations</span>
                <h3 className="fw-bold text-success mb-0 mt-1">{metrics?.completed_appointments_count || 0}</h3>
              </div>
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <i className="bi bi-check2-all fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Patients Treated</span>
                <h3 className="fw-bold text-secondary mb-0 mt-1">{metrics?.unique_patients_treated || 0}</h3>
              </div>
              <div className="bg-light text-secondary p-3 rounded-circle border">
                <i className="bi bi-people fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Queue */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0 text-dark">
            <i className="bi bi-calendar3 me-2 text-primary"></i> Today's Assigned Consultations
          </h5>
          <span className="badge bg-light text-secondary border">
            {today_appointments?.length || 0} Patient(s)
          </span>
        </div>
        <div className="card-body p-0">
          {!today_appointments || today_appointments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-calendar-check fs-1 d-block mb-2"></i>
              <p>You have no appointments on your schedule for today.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Time</th>
                    <th>Patient Name & ID</th>
                    <th>Reason for Visit</th>
                    <th>Status</th>
                    <th className="text-end">Clinical Action</th>
                  </tr>
                </thead>
                <tbody>
                  {today_appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td className="fw-bold text-primary">{apt.start_time} - {apt.end_time}</td>
                      <td>
                        <div className="fw-semibold text-dark">{apt.patient_name}</div>
                        <small className="text-muted">{apt.patient_number}</small>
                      </td>
                      <td>{apt.reason_for_visit}</td>
                      <td>
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/doctor/appointments?aptId=${apt.id}`}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          {apt.has_consultation ? 'Review Note' : 'Enter Consultation'}
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
  );
};

export default DoctorDashboard;
