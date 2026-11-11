import React, { useEffect, useState } from 'react';
import { authApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';

export const StaffManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Staff User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'DOCTOR',
    phone: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.listUsers({
        role: filterRole || undefined,
        search: search || undefined,
      });
      setUsers(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authApi.createStaffUser(newUser);
      setSuccess(`Staff user '${newUser.username}' created successfully.`);
      setIsModalOpen(false);
      setNewUser({
        username: '', email: '', password: '', first_name: '', last_name: '',
        role: 'DOCTOR', phone: '',
      });
      fetchUsers();
    } catch (err) {
      const errs = err.response?.data;
      setError(typeof errs === 'object' ? JSON.stringify(errs) : 'Failed to create staff account.');
    }
  };

  const handleToggleActive = async (userObj) => {
    try {
      await authApi.updateUser(userObj.id, { is_active: !userObj.is_active });
      setSuccess(`Account status updated for user '${userObj.username}'.`);
      fetchUsers();
    } catch (err) {
      setError('Failed to update account status.');
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Staff & User Account Management</h2>
          <p className="text-muted mb-0">Control administrative, medical, reception, and pharmacy staff credentials.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="bi bi-person-plus-fill me-1"></i> Create Staff Account
        </button>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-light">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by username, email, name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="DOCTOR">Doctor</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="PATIENT">Patient</option>
            </select>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              Filter
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading user directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          message="No accounts match your search filter."
          icon="bi-people"
        />
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th className="text-end">Controls</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-bold text-secondary">#{u.id}</td>
                    <td className="fw-semibold text-dark">{u.username}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'bg-danger' :
                        u.role === 'DOCTOR' ? 'bg-primary' :
                        u.role === 'RECEPTIONIST' ? 'bg-info text-dark' :
                        u.role === 'PHARMACIST' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {u.role_display || u.role}
                      </span>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'}`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Staff Account Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Create Staff User Account</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Role *</label>
                      <select
                        className="form-select"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        required
                      >
                        <option value="DOCTOR">Doctor</option>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="PHARMACIST">Pharmacist</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Min. 8 characters"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    Create User Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
