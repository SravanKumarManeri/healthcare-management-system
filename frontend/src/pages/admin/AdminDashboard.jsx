import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardsApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await dashboardsApi.getAdmin();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load administrator dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading hospital system metrics..." />;

  const { metrics, recent_appointments } = data || {};

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Hospital Administration Console</h2>
          <p className="text-muted mb-0">System-wide operational oversight, staff controls, and analytics.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/staff" className="btn btn-primary fw-semibold">
            <i className="bi bi-person-plus me-1"></i> Add Staff Account
          </Link>
          <a
            href="http://127.0.0.1:8000/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline-secondary fw-semibold"
          >
            <i className="bi bi-file-code me-1"></i> Swagger API
          </a>
        </div>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />

      {/* KPI Metrics Grid */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Total Patients</span>
                <h3 className="fw-bold text-primary mb-0 mt-1">{metrics?.total_patients || 0}</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Active Doctors</span>
                <h3 className="fw-bold text-success mb-0 mt-1">{metrics?.total_doctors || 0}</h3>
              </div>
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <i className="bi bi-heart-pulse-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Clinic Staff</span>
                <h3 className="fw-bold text-info mb-0 mt-1">{metrics?.total_staff || 0}</h3>
              </div>
              <div className="bg-info-subtle text-info p-3 rounded-circle">
                <i className="bi bi-person-badge-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Departments</span>
                <h3 className="fw-bold text-secondary mb-0 mt-1">{metrics?.total_departments || 0}</h3>
              </div>
              <div className="bg-light text-secondary p-3 rounded-circle border">
                <i className="bi bi-diagram-3-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments Status Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0 text-dark">
                <i className="bi bi-calendar-event me-2 text-primary"></i> Today's Appointment Status Breakdown
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3 text-center">
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block">Total Scheduled</span>
                    <h4 className="fw-bold text-primary mb-0">{metrics?.today_appointments_total || 0}</h4>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-info-subtle rounded-3 border border-info">
                    <span className="text-info small d-block fw-semibold">Booked / Pending</span>
                    <h4 className="fw-bold text-info mb-0">{metrics?.today_booked || 0}</h4>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-warning-subtle rounded-3 border border-warning">
                    <span className="text-warning-emphasis small d-block fw-semibold">Checked In</span>
                    <h4 className="fw-bold text-warning-emphasis mb-0">{metrics?.today_checked_in || 0}</h4>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-3 bg-success-subtle rounded-3 border border-success">
                    <span className="text-success small d-block fw-semibold">Completed</span>
                    <h4 className="fw-bold text-success mb-0">{metrics?.today_completed || 0}</h4>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Total Lifetime Appointments: <strong>{metrics?.total_appointments || 0}</strong></span>
                  <Link to="/admin/appointments" className="btn btn-sm btn-outline-primary">
                    View Complete Appointment Registry &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links & Inventory Notice */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-3 mb-3 bg-danger-subtle text-danger p-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0">Pharmacy Inventory Alert</h6>
              <i className="bi bi-exclamation-triangle-fill fs-4"></i>
            </div>
            <h3 className="fw-bold mb-1">{metrics?.low_stock_medicines || 0}</h3>
            <p className="small mb-3">Medicine(s) currently below their designated reorder threshold.</p>
            <Link to="/pharmacy/catalog" className="btn btn-sm btn-danger fw-bold">
              Inspect Stock Catalogue
            </Link>
          </div>

          <div className="card shadow-sm border-0 rounded-3 p-3">
            <h6 className="fw-bold mb-3 text-secondary">Quick Administration</h6>
            <div className="d-grid gap-2">
              <Link to="/admin/staff" className="btn btn-sm btn-outline-primary text-start">
                <i className="bi bi-people me-2"></i> Manage Staff & Roles
              </Link>
              <Link to="/admin/departments" className="btn btn-sm btn-outline-primary text-start">
                <i className="bi bi-diagram-3 me-2"></i> Configure Departments
              </Link>
              <Link to="/admin/doctors" className="btn btn-sm btn-outline-primary text-start">
                <i className="bi bi-heart-pulse me-2"></i> Doctor Profiles & Fees
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0 text-dark">
            <i className="bi bi-activity me-2 text-primary"></i> Recent Clinical Activity
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Apt #</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_appointments?.map((apt) => (
                  <tr key={apt.id}>
                    <td className="fw-bold">#{apt.id}</td>
                    <td>{apt.patient__first_name} {apt.patient__last_name}</td>
                    <td>Dr. {apt.doctor__user__first_name} {apt.doctor__user__last_name}</td>
                    <td>{apt.appointment_date} at {apt.start_time}</td>
                    <td><StatusBadge status={apt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
