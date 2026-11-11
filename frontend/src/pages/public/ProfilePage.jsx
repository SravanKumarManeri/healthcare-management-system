import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { AlertMessage } from '../../components/common/Feedback';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passData, setPassData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await authApi.updateProfile(formData);
      updateUser(res.data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.confirm_password) {
      setPassMsg({ type: 'danger', text: 'New passwords do not match.' });
      return;
    }
    setLoading(true);
    setPassMsg({ type: '', text: '' });
    try {
      await authApi.changePassword({
        old_password: passData.old_password,
        new_password: passData.new_password,
      });
      setPassMsg({ type: 'success', text: 'Password changed successfully.' });
      setPassData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const errDetail = err.response?.data?.detail || err.response?.data?.old_password?.[0] || 'Password change failed.';
      setPassMsg({ type: 'danger', text: errDetail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="fw-bold mb-4">My Account Profile</h2>

          {/* User Overview Card */}
          <div className="card shadow-sm border-0 mb-4 p-4 rounded-3 bg-light">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-2 fw-bold" style={{ width: '64px', height: '64px' }}>
                {user?.username?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="fw-bold mb-0">{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}</h4>
                <div className="d-flex gap-2 align-items-center mt-1">
                  <span className="badge bg-primary">{user?.role_display || user?.role}</span>
                  <span className="text-muted small">Username: <strong>{user?.username}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="card shadow-sm border-0 mb-4 rounded-3">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0 text-primary">Personal & Contact Information</h5>
            </div>
            <div className="card-body p-4">
              <AlertMessage
                type={profileMsg.type}
                message={profileMsg.text}
                onDismiss={() => setProfileMsg({ type: '', text: '' })}
              />
              <form onSubmit={handleProfileSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="text-end mt-4">
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0 text-danger">Change Password</h5>
            </div>
            <div className="card-body p-4">
              <AlertMessage
                type={passMsg.type}
                message={passMsg.text}
                onDismiss={() => setPassMsg({ type: '', text: '' })}
              />
              <form onSubmit={handlePasswordSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passData.old_password}
                      onChange={(e) => setPassData({ ...passData, old_password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passData.new_password}
                      onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passData.confirm_password}
                      onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="text-end mt-4">
                  <button type="submit" className="btn btn-outline-danger px-4" disabled={loading}>
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
