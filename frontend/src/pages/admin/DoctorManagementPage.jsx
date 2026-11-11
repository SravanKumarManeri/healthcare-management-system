import React, { useEffect, useState } from 'react';
import { doctorsApi, departmentsApi, authApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';

export const DoctorManagementPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    user: '',
    department: '',
    specialization: '',
    qualifications: '',
    experience_years: 5,
    consultation_fee: 50.00,
    phone: '',
    bio: '',
    is_available: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, deptRes, userRes] = await Promise.all([
        doctorsApi.list(),
        departmentsApi.list(),
        authApi.listUsers({ role: 'DOCTOR' }),
      ]);
      setDoctors(docRes.data.results || docRes.data || []);
      setDepartments(deptRes.data.results || deptRes.data || []);
      setAvailableUsers(userRes.data.results || userRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch doctor profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingDoctor(null);
    setFormData({
      user: '',
      department: departments[0]?.id || '',
      specialization: '',
      qualifications: 'MBBS, MD',
      experience_years: 5,
      consultation_fee: 50.00,
      phone: '',
      bio: '',
      is_available: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingDoctor(doc);
    setFormData({
      user: doc.user,
      department: doc.department,
      specialization: doc.specialization,
      qualifications: doc.qualifications,
      experience_years: doc.experience_years,
      consultation_fee: doc.consultation_fee,
      phone: doc.phone,
      bio: doc.bio,
      is_available: doc.is_available,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingDoctor) {
        await doctorsApi.update(editingDoctor.id, formData);
        setSuccess(`Doctor profile for '${editingDoctor.full_name}' updated.`);
      } else {
        await doctorsApi.create(formData);
        setSuccess('New doctor profile established successfully.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Operation failed.');
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Doctor Profiles & Credentials</h2>
          <p className="text-muted mb-0">Manage consulting specialist records, departmental associations, and fees.</p>
        </div>
        <button type="button" className="btn btn-primary fw-semibold" onClick={openCreateModal}>
          <i className="bi bi-person-plus-fill me-1"></i> Add Doctor Profile
        </button>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner message="Loading doctors..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Doctor Name</th>
                    <th>Department</th>
                    <th>Specialization</th>
                    <th>Qualifications</th>
                    <th>Experience</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc.id}>
                      <td className="fw-bold text-dark">{doc.full_name}</td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary">
                          {doc.department_name}
                        </span>
                      </td>
                      <td>{doc.specialization}</td>
                      <td className="small text-muted">{doc.qualifications}</td>
                      <td>{doc.experience_years} Years</td>
                      <td className="fw-bold">${doc.consultation_fee}</td>
                      <td>
                        <span className={`badge ${doc.is_available ? 'bg-success' : 'bg-secondary'}`}>
                          {doc.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openEditModal(doc)}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {editingDoctor ? `Edit Profile: ${editingDoctor.full_name}` : 'Create Doctor Profile'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {!editingDoctor && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Linked Staff User *</label>
                        <select
                          className="form-select"
                          value={formData.user}
                          onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                          required
                        >
                          <option value="">-- Choose User Account --</option>
                          {availableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.username} ({u.first_name} {u.last_name})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Department *</label>
                      <select
                        className="form-select"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Department --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Specialization *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="e.g. Interventional Cardiology"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Qualifications *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.qualifications}
                        onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                        placeholder="e.g. MBBS, MD, FRCS"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Experience (Years)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.experience_years}
                        onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value, 10) })}
                        min="0"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Consultation Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.consultation_fee}
                        onChange={(e) => setFormData({ ...formData, consultation_fee: parseFloat(e.target.value) })}
                        min="0"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Doctor Bio / Background</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.is_available}
                          onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                          id="docAvailCheck"
                        />
                        <label className="form-check-label" htmlFor="docAvailCheck">
                          Active & Open for Patient Appointments
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    {editingDoctor ? 'Save Changes' : 'Create Profile'}
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

export default DoctorManagementPage;
