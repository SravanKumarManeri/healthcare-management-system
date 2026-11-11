import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertMessage } from '../../components/common/Feedback';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectByRole = (role) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    switch (role) {
      case 'ADMIN':
        navigate('/admin', { replace: true });
        break;
      case 'DOCTOR':
        navigate('/doctor', { replace: true });
        break;
      case 'RECEPTIONIST':
        navigate('/reception', { replace: true });
        break;
      case 'PHARMACIST':
        navigate('/pharmacy', { replace: true });
        break;
      default:
        navigate('/patient', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const user = await login(username, password);
      redirectByRole(user.role);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.detail ||
        'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-primary text-white text-center py-4">
              <i className="bi bi-hospital fs-1 mb-2 d-block text-warning"></i>
              <h4 className="fw-bold mb-1">CarePulse Portal</h4>
              <p className="text-white-50 small mb-0">Sign in to your Healthcare Management System</p>
            </div>

            <div className="card-body p-4 p-md-5">
              <AlertMessage message={error} onDismiss={() => setError('')} />

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Username</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><i className="bi bi-person"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin, dr.smith, john.doe"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><i className="bi bi-lock"></i></span>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : (
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                  )}
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-4 pt-3 border-top text-center">
                <span className="text-muted small">New patient? </span>
                <Link to="/register" className="fw-bold text-decoration-none">
                  Register here
                </Link>
              </div>

              {/* Quick Demo Credentials Panel */}
              <div className="mt-4 p-3 bg-light rounded-3 border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold small text-uppercase text-secondary">
                    <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Demo Quick Login
                  </span>
                  <small className="text-muted">Click to auto-fill</small>
                </div>
                <div className="d-flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger flex-grow-1"
                    onClick={() => handleQuickFill('admin', 'AdminPass123!')}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary flex-grow-1"
                    onClick={() => handleQuickFill('dr.smith', 'DoctorPass123!')}
                  >
                    Doctor
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info flex-grow-1"
                    onClick={() => handleQuickFill('receptionist1', 'ReceptionPass123!')}
                  >
                    Reception
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success flex-grow-1"
                    onClick={() => handleQuickFill('pharmacist1', 'PharmacyPass123!')}
                  >
                    Pharmacy
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary flex-grow-1"
                    onClick={() => handleQuickFill('john.doe', 'PatientPass123!')}
                  >
                    Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
