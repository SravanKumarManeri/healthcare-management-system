import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi, doctorsApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage, ConfirmModal } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Cancellation State
  const [cancellingApt, setCancellingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');

  // Reschedule State
  const [reschedulingApt, setReschedulingApt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // History Audit Modal State
  const [historyApt, setHistoryApt] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list({ status: filterStatus || undefined });
      setAppointments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus]);

  // Handle Cancel
  const handleConfirmCancel = async () => {
    if (!cancellingApt) return;
    try {
      await appointmentsApi.cancel(cancellingApt.id, cancelReason);
      setSuccess(`Appointment #${cancellingApt.id} was successfully cancelled.`);
      setCancellingApt(null);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel appointment.');
    }
  };

  // Open Reschedule Modal & load slots
  const openRescheduleModal = async (apt) => {
    setReschedulingApt(apt);
    setRescheduleDate(new Date().toISOString().split('T')[0]);
    setSelectedRescheduleSlot(null);
    loadRescheduleSlots(apt.doctor, new Date().toISOString().split('T')[0]);
  };

  const loadRescheduleSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    try {
      const res = await doctorsApi.getSlots(doctorId, date);
      setRescheduleSlots(res.data.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingApt || !selectedRescheduleSlot) return;
    try {
      await appointmentsApi.reschedule(reschedulingApt.id, {
        appointment_date: rescheduleDate,
        start_time: selectedRescheduleSlot.start_time,
        end_time: selectedRescheduleSlot.end_time,
        reason: 'Rescheduled via Patient Portal',
      });
      setSuccess(`Appointment #${reschedulingApt.id} rescheduled successfully to ${rescheduleDate} at ${selectedRescheduleSlot.start_time}.`);
      setReschedulingApt(null);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Rescheduling failed.');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">My Appointments</h2>
          <p className="text-muted mb-0">View your clinical visits, reschedule, or cancel bookings.</p>
        </div>
        <Link to="/patient/book" className="btn btn-primary fw-semibold">
          <i className="bi bi-calendar-plus me-1"></i> Book New Appointment
        </Link>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Filter Tabs */}
      <div className="mb-4 d-flex gap-2 border-bottom pb-2">
        <button
          className={`btn btn-sm ${!filterStatus ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('')}
        >
          All
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'BOOKED' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('BOOKED')}
        >
          Booked
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'CHECKED_IN' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('CHECKED_IN')}
        >
          Checked In
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'COMPLETED' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('COMPLETED')}
        >
          Completed
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'CANCELLED' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterStatus('CANCELLED')}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          message="You do not have any appointments matching this filter."
          icon="bi-calendar-x"
          action={
            <Link to="/patient/book" className="btn btn-primary mt-2">
              Book Your First Appointment
            </Link>
          }
        />
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Appointment #</th>
                  <th>Date & Time</th>
                  <th>Doctor & Specialty</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const canCancelOrReschedule = ['BOOKED', 'CONFIRMED'].includes(apt.status);
                  return (
                    <tr key={apt.id}>
                      <td className="fw-bold text-secondary">#{apt.id}</td>
                      <td>
                        <div className="fw-bold">{apt.appointment_date}</div>
                        <small className="text-muted">{apt.start_time} - {apt.end_time}</small>
                      </td>
                      <td>
                        <div className="fw-semibold text-primary">{apt.doctor_name}</div>
                        <small className="text-muted">{apt.department_name}</small>
                      </td>
                      <td style={{ maxWidth: '200px' }} className="text-truncate">
                        {apt.reason_for_visit}
                      </td>
                      <td>
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {canCancelOrReschedule && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => openRescheduleModal(apt)}
                                title="Reschedule"
                              >
                                <i className="bi bi-clock-history me-1"></i> Reschedule
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => setCancellingApt(apt)}
                                title="Cancel"
                              >
                                <i className="bi bi-x-circle me-1"></i> Cancel
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setHistoryApt(apt)}
                            title="Audit History"
                          >
                            <i className="bi bi-info-circle"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancellingApt && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Cancel Appointment #{cancellingApt.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setCancellingApt(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p>Are you sure you wish to cancel your appointment with <strong>{cancellingApt.doctor_name}</strong> on <strong>{cancellingApt.appointment_date}</strong>?</p>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Reason for Cancellation</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Scheduling conflict, symptom resolved"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setCancellingApt(null)}>
                  Keep Appointment
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmCancel}>
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingApt && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Reschedule Appointment #{reschedulingApt.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setReschedulingApt(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted">Currently scheduled for: <strong>{reschedulingApt.appointment_date}</strong> at <strong>{reschedulingApt.start_time}</strong> with {reschedulingApt.doctor_name}</p>

                <div className="row g-3 align-items-center mb-4">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Select New Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={rescheduleDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setRescheduleDate(e.target.value);
                        setSelectedRescheduleSlot(null);
                        loadRescheduleSlots(reschedulingApt.doctor, e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Choose New Available Slot</label>
                  {slotsLoading ? (
                    <LoadingSpinner message="Checking doctor schedule..." />
                  ) : rescheduleSlots.length === 0 ? (
                    <div className="alert alert-warning py-2 small">
                      No available slots found for this doctor on {rescheduleDate}.
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {rescheduleSlots.map((slot, idx) => {
                        const isSelected = selectedRescheduleSlot?.start_time === slot.start_time;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!slot.is_available}
                            className={`btn btn-sm ${
                              isSelected
                                ? 'btn-primary'
                                : slot.is_available
                                ? 'btn-outline-primary'
                                : 'btn-light text-muted disabled'
                            }`}
                            onClick={() => setSelectedRescheduleSlot(slot)}
                          >
                            {slot.start_time} - {slot.end_time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {selectedRescheduleSlot && (
                    <div className="mt-2 text-success small fw-semibold">
                      Selected slot: {selectedRescheduleSlot.start_time} - {selectedRescheduleSlot.end_time}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReschedulingApt(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selectedRescheduleSlot}
                  onClick={handleConfirmReschedule}
                >
                  Save New Appointment Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Audit Modal */}
      {historyApt && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">Audit History: Appointment #{historyApt.id}</h5>
                <button type="button" className="btn-close" onClick={() => setHistoryApt(null)}></button>
              </div>
              <div className="modal-body p-4">
                {historyApt.status_history?.length === 0 ? (
                  <p className="text-muted">No historical status transitions recorded.</p>
                ) : (
                  <ul className="timeline list-unstyled mb-0">
                    {historyApt.status_history?.map((h) => (
                      <li key={h.id} className="mb-3 border-start ps-3 position-relative">
                        <div className="fw-bold small text-dark">
                          {h.old_status ? `${h.old_status} -> ` : ''}{h.new_status}
                        </div>
                        <small className="text-muted d-block">
                          By: {h.changed_by_username || 'System'} at {new Date(h.changed_at).toLocaleString()}
                        </small>
                        {h.reason && <small className="text-secondary italic">"{h.reason}"</small>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHistoryApt(null)}>
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

export default MyAppointmentsPage;
