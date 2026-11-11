import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appointmentsApi, consultationsApi, pharmacyApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const DoctorAppointmentsPage = () => {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Consultation Modal State
  const [activeApt, setActiveApt] = useState(null);
  const [consultationData, setConsultationData] = useState({
    symptoms_or_history: '',
    examination_notes: '',
    diagnosis: '',
    advice: '',
    follow_up_date: '',
  });

  // Prescription Items State
  const [rxItems, setRxItems] = useState([]);
  const [newRxItem, setNewRxItem] = useState({
    medicine: '',
    dosage_instructions: '1 tablet after food',
    frequency: 'TDS (3 times daily)',
    duration: '5 days',
    quantity: 10,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list();
      const list = res.data.results || res.data || [];
      setAppointments(list);

      // Check if URL specifies aptId to open consultation directly
      const urlAptId = searchParams.get('aptId');
      if (urlAptId) {
        const found = list.find((a) => String(a.id) === String(urlAptId));
        if (found) {
          openConsultationModal(found);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await pharmacyApi.listMedicines({ is_active: true });
        setMedicines(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMeds();
    fetchAppointments();
  }, []);

  const openConsultationModal = async (apt) => {
    setActiveApt(apt);
    setRxItems([]);
    setError('');
    // Check if consultation already exists
    if (apt.has_consultation) {
      try {
        const res = await consultationsApi.list({ appointment: apt.id });
        const existing = (res.data.results || res.data || [])[0];
        if (existing) {
          setConsultationData({
            symptoms_or_history: existing.symptoms_or_history || '',
            examination_notes: existing.examination_notes || '',
            diagnosis: existing.diagnosis || '',
            advice: existing.advice || '',
            follow_up_date: existing.follow_up_date || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setConsultationData({
        symptoms_or_history: `Patient presents for ${apt.reason_for_visit}.`,
        examination_notes: 'Vital signs stable. Heart sounds S1 S2 normal. Lungs clear.',
        diagnosis: 'Clinical Impression (Demo Data)',
        advice: 'Adequate rest, hydration, return if symptoms worsen.',
        follow_up_date: '',
      });
    }
  };

  const handleAddRxItem = () => {
    if (!newRxItem.medicine) {
      alert("Please select a medicine.");
      return;
    }
    const medObj = medicines.find((m) => String(m.id) === String(newRxItem.medicine));
    setRxItems([
      ...rxItems,
      {
        ...newRxItem,
        medicine: parseInt(newRxItem.medicine, 10),
        medicine_name: medObj ? medObj.name : 'Medicine',
      },
    ]);
    setNewRxItem({
      medicine: '',
      dosage_instructions: '1 tablet after food',
      frequency: 'TDS (3 times daily)',
      duration: '5 days',
      quantity: 10,
      notes: '',
    });
  };

  const handleRemoveRxItem = (index) => {
    setRxItems(rxItems.filter((_, idx) => idx !== index));
  };

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!activeApt) return;
    setSubmitting(true);
    setError('');
    try {
      // 1. Create or update Consultation
      const consultRes = await consultationsApi.create({
        appointment: activeApt.id,
        symptoms_or_history: consultationData.symptoms_or_history,
        examination_notes: consultationData.examination_notes,
        diagnosis: consultationData.diagnosis,
        advice: consultationData.advice,
        follow_up_date: consultationData.follow_up_date || null,
        status: 'FINAL',
      });

      // 2. If prescription items were added, create Prescription
      if (rxItems.length > 0) {
        await pharmacyApi.createPrescription({
          patient: activeApt.patient,
          consultation: consultRes.data.id,
          notes: 'Take medications strictly as instructed. [Portfolio Demo]',
          items: rxItems.map((it) => ({
            medicine: it.medicine,
            dosage_instructions: it.dosage_instructions,
            frequency: it.frequency,
            duration: it.duration,
            quantity: parseInt(it.quantity, 10),
            notes: it.notes || '',
          })),
        });
      }

      setSuccess(`Consultation & e-prescription saved for Appointment #${activeApt.id}.`);
      setActiveApt(null);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.appointment || err.response?.data?.detail || 'Failed to save consultation.';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Clinical Consultations & Queue</h2>
          <p className="text-muted mb-0">Record physical examination notes, diagnoses, and issue verified e-prescriptions.</p>
        </div>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {loading ? (
        <LoadingSpinner message="Loading assigned appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No assigned appointments found"
          message="Appointments booked with your profile will appear here."
          icon="bi-journal-x"
        />
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Apt #</th>
                  <th>Date & Time</th>
                  <th>Patient Info</th>
                  <th>Reason for Visit</th>
                  <th>Status</th>
                  <th>Clinical Note</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td className="fw-bold text-secondary">#{apt.id}</td>
                    <td>
                      <div className="fw-bold">{apt.appointment_date}</div>
                      <small className="text-muted">{apt.start_time} - {apt.end_time}</small>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{apt.patient_name}</div>
                      <small className="text-muted">{apt.patient_number} &bull; {apt.patient_phone}</small>
                    </td>
                    <td style={{ maxWidth: '220px' }} className="text-truncate">
                      {apt.reason_for_visit}
                    </td>
                    <td>
                      <StatusBadge status={apt.status} />
                    </td>
                    <td>
                      {apt.has_consultation ? (
                        <span className="badge bg-success-subtle text-success border border-success">
                          <i className="bi bi-file-earmark-medical me-1"></i> Recorded
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary fw-semibold"
                        onClick={() => openConsultationModal(apt)}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        {apt.has_consultation ? 'Review Note' : 'Start Consultation'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consultation & Prescription Modal */}
      {activeApt && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-clipboard2-pulse me-2"></i>
                  Clinical Consultation: {activeApt.patient_name} ({activeApt.patient_number})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveApt(null)}></button>
              </div>

              <form onSubmit={handleSaveConsultation}>
                <div className="modal-body p-4">
                  {/* Demo Disclaimer Alert */}
                  <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-info-circle-fill fs-5"></i>
                    <div>
                      <strong>Demo Clinical Record:</strong> Entries here are synthetic portfolio demonstrations and do not represent verified medical advice.
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Chief Symptoms & Present History *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={consultationData.symptoms_or_history}
                        onChange={(e) => setConsultationData({ ...consultationData, symptoms_or_history: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Physical Examination Findings</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={consultationData.examination_notes}
                        onChange={(e) => setConsultationData({ ...consultationData, examination_notes: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark">Clinical Diagnosis *</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={consultationData.diagnosis}
                        onChange={(e) => setConsultationData({ ...consultationData, diagnosis: e.target.value })}
                        required
                      ></textarea>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold text-dark">General Advice & Precautions</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={consultationData.advice}
                        onChange={(e) => setConsultationData({ ...consultationData, advice: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label fw-bold text-dark">Follow-up Date</label>
                      <input
                        type="date"
                        className="form-control"
                        min={new Date().toISOString().split('T')[0]}
                        value={consultationData.follow_up_date}
                        onChange={(e) => setConsultationData({ ...consultationData, follow_up_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* e-Prescription Section */}
                  <h6 className="fw-bold text-primary border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-capsule"></i> Issue e-Prescription
                  </h6>

                  {/* Add Medication Row */}
                  <div className="card bg-light border-0 p-3 mb-3">
                    <div className="row g-2 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold">Medicine</label>
                        <select
                          className="form-select form-select-sm"
                          value={newRxItem.medicine}
                          onChange={(e) => setNewRxItem({ ...newRxItem, medicine: e.target.value })}
                        >
                          <option value="">-- Choose Medicine --</option>
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold">Dosage Instructions</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={newRxItem.dosage_instructions}
                          onChange={(e) => setNewRxItem({ ...newRxItem, dosage_instructions: e.target.value })}
                          placeholder="e.g. 1 tab after food"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Frequency</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={newRxItem.frequency}
                          onChange={(e) => setNewRxItem({ ...newRxItem, frequency: e.target.value })}
                          placeholder="e.g. TDS, BD, OD"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small fw-semibold">Duration & Qty</label>
                        <div className="input-group input-group-sm">
                          <input
                            type="text"
                            className="form-control"
                            value={newRxItem.duration}
                            onChange={(e) => setNewRxItem({ ...newRxItem, duration: e.target.value })}
                            placeholder="5 days"
                          />
                          <input
                            type="number"
                            className="form-control"
                            value={newRxItem.quantity}
                            onChange={(e) => setNewRxItem({ ...newRxItem, quantity: e.target.value })}
                            min="1"
                            style={{ maxWidth: '60px' }}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary w-100 fw-semibold"
                          onClick={handleAddRxItem}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Add Item
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prescription Items Table */}
                  {rxItems.length > 0 && (
                    <div className="table-responsive border rounded-3 mb-3">
                      <table className="table table-sm table-striped align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage Instructions</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Total Qty</th>
                            <th className="text-end">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rxItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="fw-bold">{item.medicine_name}</td>
                              <td>{item.dosage_instructions}</td>
                              <td>{item.frequency}</td>
                              <td>{item.duration}</td>
                              <td><span className="badge bg-secondary">{item.quantity}</span></td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger py-0"
                                  onClick={() => handleRemoveRxItem(idx)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveApt(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold px-4" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Finalize & Sign Consultation Note'}
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

export default DoctorAppointmentsPage;
