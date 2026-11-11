import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api';
import { AlertMessage } from '../../components/common/Feedback';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'PREFER_NOT_TO_SAY',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = { ...formData };
      delete payload.confirm_password;
      await authApi.register(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Failed to complete registration. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-7">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-primary text-white py-4 px-4 text-center">
              <h4 className="fw-bold mb-1">Patient Portal Registration</h4>
              <p className="text-white-50 small mb-0">Create your health record profile to book appointments and view prescriptions.</p>
            </div>

            <div className="card-body p-4 p-md-5">
              {success ? (
                <div className="alert alert-success text-center py-4">
                  <i className="bi bi-check-circle-fill fs-1 text-success d-block mb-2"></i>
                  <h5>Registration Successful!</h5>
                  <p className="mb-0 text-muted">Your patient account has been created. Redirecting to login...</p>
                </div>
              ) : (
                <>
                  <AlertMessage message={error} onDismiss={() => setError('')} />

                  <form onSubmit={handleSubmit}>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">1. Account Credentials</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Username *</label>
                        <input
                          type="text"
                          name="username"
                          className="form-control"
                          value={formData.username}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Password *</label>
                        <input
                          type="password"
                          name="password"
                          className="form-control"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Min. 8 characters"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Confirm Password *</label>
                        <input
                          type="password"
                          name="confirm_password"
                          className="form-control"
                          value={formData.confirm_password}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">2. Personal & Contact Details</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name *</label>
                        <input
                          type="text"
                          name="first_name"
                          className="form-control"
                          value={formData.first_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name *</label>
                        <input
                          type="text"
                          name="last_name"
                          className="form-control"
                          value={formData.last_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          className="form-control"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1-555-0100"
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Date of Birth</label>
                        <input
                          type="date"
                          name="date_of_birth"
                          className="form-control"
                          value={formData.date_of_birth}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Gender</label>
                        <select
                          name="gender"
                          className="form-select"
                          value={formData.gender}
                          onChange={handleChange}
                        >
                          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Residential Address</label>
                        <textarea
                          name="address"
                          className="form-control"
                          rows="2"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Street, City, State/Province"
                        ></textarea>
                      </div>
                    </div>

                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">3. Emergency Contact (Optional)</h6>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Emergency Contact Name</label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          className="form-control"
                          value={formData.emergency_contact_name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Emergency Contact Phone</label>
                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          className="form-control"
                          value={formData.emergency_contact_phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                      disabled={loading}
                    >
                      {loading ? 'Submitting registration...' : 'Complete Registration'}
                    </button>
                  </form>

                  <div className="text-center mt-3">
                    <small className="text-muted">Already have an account? </small>
                    <Link to="/login" className="small fw-bold">Sign In</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
