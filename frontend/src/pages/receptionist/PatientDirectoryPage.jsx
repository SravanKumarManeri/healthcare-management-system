import React, { useEffect, useState } from 'react';
import { patientsApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';

export const PatientDirectoryPage = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Patient Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'PREFER_NOT_TO_SAY',
    blood_group: 'UNKNOWN',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    administrative_notes: '',
  });

  // Selected Patient Details Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const res = await patientsApi.list({ search: query || undefined });
      setPatients(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await patientsApi.create(newPatient);
      setSuccess("New patient registered successfully!");
      setIsNewModalOpen(false);
      setNewPatient({
        first_name: '', last_name: '', phone: '', email: '',
        date_of_birth: '', gender: 'PREFER_NOT_TO_SAY', blood_group: 'UNKNOWN',
        address: '', emergency_contact_name: '', emergency_contact_phone: '',
        administrative_notes: '',
      });
      fetchPatients();
    } catch (err) {
      const errs = err.response?.data;
      setError(typeof errs === 'object' ? JSON.stringify(errs) : 'Failed to register patient.');
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Patient Directory & Registry</h2>
          <p className="text-muted mb-0">Search patient records, view profiles, and register walk-in patients.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => setIsNewModalOpen(true)}
        >
          <i className="bi bi-person-plus-fill me-1"></i> Register New Patient
        </button>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Search Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-light">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-md-9">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Patient ID (e.g. PAT-), Name, or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1">
              Search
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearch('');
                fetchPatients('');
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Searching patient database..." />
      ) : patients.length === 0 ? (
        <EmptyState
          title="No patients found"
          message="No patient profiles match your search criteria."
          icon="bi-people"
          action={
            <button className="btn btn-primary mt-2" onClick={() => setIsNewModalOpen(true)}>
              Register This Patient
            </button>
          }
        />
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Phone Number</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th className="text-end">Details</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold text-primary font-monospace">{p.patient_number}</td>
                    <td className="fw-semibold text-dark">{p.full_name}</td>
                    <td>{p.phone}</td>
                    <td>{p.date_of_birth || 'N/A'}</td>
                    <td>
                      <span className="badge bg-light text-secondary border">{p.gender}</span>
                    </td>
                    <td>
                      <span className="badge bg-danger-subtle text-danger border border-danger">{p.blood_group}</span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedPatient(p)}
                      >
                        <i className="bi bi-eye me-1"></i> View Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {isNewModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Register Walk-in Patient</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsNewModalOpen(false)}></button>
              </div>
              <form onSubmit={handleCreatePatient}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newPatient.first_name}
                        onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newPatient.last_name}
                        onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email (Optional)</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newPatient.email}
                        onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newPatient.date_of_birth}
                        onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Gender</label>
                      <select
                        className="form-select"
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      >
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Blood Group</label>
                      <select
                        className="form-select"
                        value={newPatient.blood_group}
                        onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                      >
                        <option value="UNKNOWN">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={newPatient.address}
                        onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Emergency Contact Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newPatient.emergency_contact_name}
                        onChange={(e) => setNewPatient({ ...newPatient, emergency_contact_name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newPatient.emergency_contact_phone}
                        onChange={(e) => setNewPatient({ ...newPatient, emergency_contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    Register Patient Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Patient Details Modal */}
      {selectedPatient && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  Patient Profile: {selectedPatient.full_name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedPatient(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block">System Patient Number</small>
                    <span className="fw-bold fs-5 text-primary">{selectedPatient.patient_number}</span>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Blood Group</small>
                    <span className="badge bg-danger-subtle text-danger border border-danger">{selectedPatient.blood_group}</span>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Phone Number</small>
                    <strong>{selectedPatient.phone}</strong>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Email</small>
                    <span>{selectedPatient.email || 'None'}</span>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Date of Birth / Gender</small>
                    <span>{selectedPatient.date_of_birth || 'N/A'} ({selectedPatient.gender})</span>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Emergency Contact</small>
                    <span>{selectedPatient.emergency_contact_name || 'N/A'} - {selectedPatient.emergency_contact_phone || ''}</span>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">Address</small>
                    <p className="mb-0 text-secondary">{selectedPatient.address || 'No address specified.'}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedPatient(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDirectoryPage;
