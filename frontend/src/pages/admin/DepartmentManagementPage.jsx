import React, { useEffect, useState } from 'react';
import { departmentsApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';

export const DepartmentManagementPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentsApi.list();
      setDepartments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description, is_active: dept.is_active });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingDept) {
        await departmentsApi.update(editingDept.id, formData);
        setSuccess(`Department '${formData.name}' updated successfully.`);
      } else {
        await departmentsApi.create(formData);
        setSuccess(`Department '${formData.name}' created successfully.`);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.name?.[0] || 'Operation failed.');
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Clinical Departments</h2>
          <p className="text-muted mb-0">Configure hospital clinical services and outpatient medical specialties.</p>
        </div>
        <button type="button" className="btn btn-primary fw-semibold" onClick={openCreateModal}>
          <i className="bi bi-plus-circle me-1"></i> Add Department
        </button>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {loading ? (
            <LoadingSpinner message="Loading departments..." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Department Name</th>
                    <th>Clinical Scope & Description</th>
                    <th>Associated Specialists</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id}>
                      <td className="fw-bold text-dark">{d.name}</td>
                      <td style={{ maxWidth: '350px' }} className="text-muted small">
                        {d.description}
                      </td>
                      <td>
                        <span className="badge bg-light text-primary border">
                          {d.doctors_count || 0} Doctor(s)
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${d.is_active ? 'bg-success-subtle text-success border border-success' : 'bg-secondary'}`}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openEditModal(d)}
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

      {/* Department Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {editingDept ? `Edit Department: ${editingDept.name}` : 'Create Department'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Department Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ophthalmology, Oncology"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      id="deptActive"
                    />
                    <label className="form-check-label" htmlFor="deptActive">
                      Active Department
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    {editingDept ? 'Save Changes' : 'Create Department'}
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

export default DepartmentManagementPage;
