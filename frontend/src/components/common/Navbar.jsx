import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout, login } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickDemoSwitch = async (roleUsername, rolePassword) => {
    try {
      await login(roleUsername, rolePassword);
      if (roleUsername === 'admin') navigate('/admin');
      else if (roleUsername === 'dr.smith') navigate('/doctor');
      else if (roleUsername === 'receptionist1') navigate('/reception');
      else if (roleUsername === 'pharmacist1') navigate('/pharmacy');
      else navigate('/patient');
    } catch (err) {
      console.error("Quick demo login failed:", err);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container-fluid px-3 px-lg-4">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
          <i className="bi bi-heart-pulse-fill fs-4 text-warning"></i>
          <span>CarePulse <span className="badge bg-light text-primary fs-6 fw-normal">HMS</span></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#hmsNavbar"
          aria-controls="hmsNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="hmsNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/doctors">
                <i className="bi bi-people me-1"></i> Doctors Directory
              </NavLink>
            </li>

            {/* Patient Links */}
            {user?.role === 'PATIENT' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/patient">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/patient/book">
                    <i className="bi bi-calendar-plus me-1"></i> Book Appointment
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/patient/appointments">
                    <i className="bi bi-calendar-check me-1"></i> My Appointments
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/patient/prescriptions">
                    <i className="bi bi-capsule me-1"></i> My Prescriptions
                  </NavLink>
                </li>
              </>
            )}

            {/* Doctor Links */}
            {user?.role === 'DOCTOR' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/doctor">
                    <i className="bi bi-speedometer2 me-1"></i> Doctor Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/doctor/appointments">
                    <i className="bi bi-journal-medical me-1"></i> Appointments & Consultations
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/doctor/schedule">
                    <i className="bi bi-clock-history me-1"></i> Working Hours & Leave
                  </NavLink>
                </li>
              </>
            )}

            {/* Receptionist Links */}
            {user?.role === 'RECEPTIONIST' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/reception">
                    <i className="bi bi-speedometer2 me-1"></i> Reception Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/reception/patients">
                    <i className="bi bi-person-lines-fill me-1"></i> Patients
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/reception/appointments">
                    <i className="bi bi-calendar-week me-1"></i> Appointment Queue
                  </NavLink>
                </li>
              </>
            )}

            {/* Pharmacist Links */}
            {user?.role === 'PHARMACIST' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/pharmacy">
                    <i className="bi bi-speedometer2 me-1"></i> Pharmacy Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/pharmacy/dispense">
                    <i className="bi bi-prescription2 me-1"></i> Dispense Prescriptions
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/pharmacy/catalog">
                    <i className="bi bi-capsule-pill me-1"></i> Medicine Catalog
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/pharmacy/stock">
                    <i className="bi bi-box-seam me-1"></i> Stock Management
                  </NavLink>
                </li>
              </>
            )}

            {/* Admin Links */}
            {user?.role === 'ADMIN' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin">
                    <i className="bi bi-speedometer2 me-1"></i> Admin Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/staff">
                    <i className="bi bi-person-badge me-1"></i> Staff Accounts
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/departments">
                    <i className="bi bi-diagram-3 me-1"></i> Departments
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/doctors">
                    <i className="bi bi-heart-pulse me-1"></i> Doctor Profiles
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/appointments">
                    <i className="bi bi-calendar-event me-1"></i> All Appointments
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {/* Quick Demo Switcher Dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-light dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-gear me-1"></i> Switch Role
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow">
                <li><h6 className="dropdown-header text-uppercase">Demo Roles</h6></li>
                <li>
                  <button className="dropdown-item" onClick={() => handleQuickDemoSwitch('admin', 'AdminPass123!')}>
                    <i className="bi bi-shield-lock-fill text-danger me-2"></i> Administrator
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => handleQuickDemoSwitch('dr.smith', 'DoctorPass123!')}>
                    <i className="bi bi-heart-pulse-fill text-primary me-2"></i> Doctor (Cardiology)
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => handleQuickDemoSwitch('receptionist1', 'ReceptionPass123!')}>
                    <i className="bi bi-person-workspace text-info me-2"></i> Receptionist
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => handleQuickDemoSwitch('pharmacist1', 'PharmacyPass123!')}>
                    <i className="bi bi-capsule text-success me-2"></i> Pharmacist
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => handleQuickDemoSwitch('john.doe', 'PatientPass123!')}>
                    <i className="bi bi-person text-secondary me-2"></i> Patient (John Doe)
                  </button>
                </li>
              </ul>
            </div>

            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="btn btn-light btn-sm dropdown-toggle fw-semibold text-primary"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.first_name ? `${user.first_name} (${user.role})` : user?.username}
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person-lines-fill me-2"></i> Profile & Password
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item" href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer">
                      <i className="bi bi-file-code me-2"></i> Swagger API Docs
                    </a>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i> Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-sm btn-outline-light">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-sm btn-warning text-dark fw-bold">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
