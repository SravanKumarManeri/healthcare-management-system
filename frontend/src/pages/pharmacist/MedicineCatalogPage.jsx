import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';

export const MedicineCatalogPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Medicine Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    generic_name: '',
    strength: '',
    dosage_form: 'TABLET',
    manufacturer: '',
    sku: '',
    unit: 'Tablet',
    reorder_level: 25,
  });

  // Batch Detail Modal State
  const [activeBatchesMed, setActiveBatchesMed] = useState(null);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await pharmacyApi.listMedicines({
        search: search || undefined,
        dosage_form: selectedForm || undefined,
      });
      setMedicines(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch medicine catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [selectedForm]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMedicines();
  };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await pharmacyApi.createMedicine(newMed);
      setSuccess("New medicine entry added to catalogue!");
      setIsModalOpen(false);
      setNewMed({
        name: '', generic_name: '', strength: '', dosage_form: 'TABLET',
        manufacturer: '', sku: '', unit: 'Tablet', reorder_level: 25,
      });
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.sku?.[0] || 'Failed to create medicine.');
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Medicine Catalogue</h2>
          <p className="text-muted mb-0">Browse medication inventory, dosage formulations, and batch stock levels.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="bi bi-plus-circle me-1"></i> Add New Medicine
        </button>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Search and Filters */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-light">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, generic name, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
            >
              <option value="">All Formulations</option>
              <option value="TABLET">Tablet</option>
              <option value="CAPSULE">Capsule</option>
              <option value="SYRUP">Syrup / Suspension</option>
              <option value="INJECTION">Injection</option>
              <option value="OINTMENT">Ointment / Cream</option>
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
        <LoadingSpinner message="Loading catalogue..." />
      ) : medicines.length === 0 ? (
        <EmptyState
          title="No medicines found"
          message="No items match your search."
          icon="bi-capsule"
          action={
            <button className="btn btn-primary mt-2" onClick={() => setIsModalOpen(true)}>
              Add Medicine Entry
            </button>
          }
        />
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>SKU</th>
                  <th>Trade & Generic Name</th>
                  <th>Strength</th>
                  <th>Formulation</th>
                  <th>Total Available Stock</th>
                  <th>Reorder Level</th>
                  <th className="text-end">Batches</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id}>
                    <td className="fw-bold font-monospace text-secondary">{m.sku}</td>
                    <td>
                      <div className="fw-semibold text-dark">{m.name}</div>
                      {m.generic_name && <small className="text-muted">{m.generic_name}</small>}
                    </td>
                    <td><span className="badge bg-light text-dark border">{m.strength}</span></td>
                    <td>{m.dosage_form_display}</td>
                    <td>
                      <span className={`badge ${m.is_low_stock ? 'bg-danger' : 'bg-success'} fs-6`}>
                        {m.total_stock} {m.unit}s
                      </span>
                      {m.is_low_stock && (
                        <small className="text-danger fw-bold d-block mt-1">Low Stock Warning</small>
                      )}
                    </td>
                    <td className="text-muted">{m.reorder_level}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setActiveBatchesMed(m)}
                      >
                        <i className="bi bi-layers me-1"></i> View Batches ({m.batches?.length || 0})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Add Medicine Entry</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <form onSubmit={handleCreateMedicine}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Trade Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newMed.name}
                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                        placeholder="e.g. Amoxicillin 500mg"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Generic / Chemical Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newMed.generic_name}
                        onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })}
                        placeholder="e.g. Amoxicillin Trihydrate"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Strength *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newMed.strength}
                        onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                        placeholder="e.g. 500 mg, 10 ml"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Dosage Form</label>
                      <select
                        className="form-select"
                        value={newMed.dosage_form}
                        onChange={(e) => setNewMed({ ...newMed, dosage_form: e.target.value })}
                      >
                        <option value="TABLET">Tablet</option>
                        <option value="CAPSULE">Capsule</option>
                        <option value="SYRUP">Syrup / Suspension</option>
                        <option value="INJECTION">Injection</option>
                        <option value="OINTMENT">Ointment / Cream</option>
                        <option value="DROPS">Drops</option>
                        <option value="INHALER">Inhaler</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">SKU Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newMed.sku}
                        onChange={(e) => setNewMed({ ...newMed, sku: e.target.value.toUpperCase() })}
                        placeholder="e.g. MED-AMX-500"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Manufacturer</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newMed.manufacturer}
                        onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Unit</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newMed.unit}
                        onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                        placeholder="Strip, Bottle"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Reorder Alert Level</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newMed.reorder_level}
                        onChange={(e) => setNewMed({ ...newMed, reorder_level: parseInt(e.target.value, 10) })}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-semibold">
                    Add Medicine
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Batches Modal */}
      {activeBatchesMed && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  Batches: {activeBatchesMed.name} ({activeBatchesMed.sku})
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveBatchesMed(null)}></button>
              </div>
              <div className="modal-body p-4">
                {!activeBatchesMed.batches || activeBatchesMed.batches.length === 0 ? (
                  <p className="text-muted text-center py-4">No inventory batches received for this medicine yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th>Batch #</th>
                          <th>Expiry Date</th>
                          <th>Received Qty</th>
                          <th>Available Qty</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeBatchesMed.batches.map((b) => (
                          <tr key={b.id}>
                            <td className="fw-bold font-monospace">{b.batch_number}</td>
                            <td>{b.expiry_date}</td>
                            <td>{b.quantity_received}</td>
                            <td className="fw-bold">{b.available_quantity}</td>
                            <td>
                              {b.is_expired ? (
                                <span className="badge bg-danger">Expired</span>
                              ) : b.available_quantity === 0 ? (
                                <span className="badge bg-secondary">Depleted</span>
                              ) : (
                                <span className="badge bg-success">Active</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveBatchesMed(null)}>
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

export default MedicineCatalogPage;
