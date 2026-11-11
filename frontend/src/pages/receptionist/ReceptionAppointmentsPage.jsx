import React, { useEffect, useState } from 'react';
import { appointmentsApi, doctorsApi, patientsApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';
import StatusBadge from '../../components/common/StatusBadge';

export const ReceptionAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Booking Modal State (Receptionist booking on behalf of patient)
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookData, setBookData] = useState({
    patient: '',
    doctor: '',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    reason_for_visit: 'Receptionist desk booking',
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list({
        doctor: filterDoctor || undefined,
        appointment_date: filterDate || undefined,
        status: filterStatus || undefined,
      });
      setAppointments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [docRes, patRes] = await Promise.all([
          doctorsApi.list({ is_available: true }),
          patientsApi.list()
        ]);
        setDoctors(docRes.data.results || docRes.data || []);
        setPatients(patRes.data.results || patRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filterDoctor, filterDate, filterStatus]);

  const handleCheckIn = async (id) => {
    try {
      await appointmentsApi.checkIn(id);
      setSuccess(`Checked in appointment #${id}.`);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check in.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentsApi.cancel(id, "Cancelled by reception staff");
      setSuccess(`Appointment #${id} has been cancelled.`);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancellation failed.');
    }
  };

  // When doctor & date change in booking modal, load slots
  const handleBookDoctorChange = async (doctorId, date) => {
    setBookData((prev) => ({ ...prev, doctor: doctorId, appointment_date: date, start_time: '', end_time: '' }));
    if (!doctorId || !date) return;
    setSlotsLoading(true);
    try {
      const res = await doctorsApi.getSlots(doctorId, date);
      setAvailableSlots(res.data.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await appointmentsApi.book({
        patient: parseInt(bookData.patient, 10),
        doctor: parseInt(bookData.doctor, 10),
        appointment_date: bookData.appointment_date,
        start_time: bookData.start_time,
        end_time: bookData.end_time,
        reason_for_visit: bookData.reason_for_visit,
      });
      setSuccess("Appointment successfully booked by reception desk!");
      setIsBookModalOpen(false);
      fetchAppointments();
    } catch (err) {
      const detail = err.response?.data?.start_time || err.response?.data?.detail || "Booking failed.";
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Appointment Management & Queue</h2>
          <p className="text-muted mb-0">Front-desk scheduling, status tracking, and check-in processing.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => setIsBookModalOpen(true)}
        >
          <i className="bi bi-calendar-plus me-1"></i> Book Appointment for Patient
        </button>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      {/* Filters Card */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-light">
        <div className="row g-2">
          <div className="col-md-4">
            <select
              className="form-select"
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="col-md-2">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setFilterDoctor('');
                setFilterDate('');
                setFilterStatus('');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading appointment schedule..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          message="No records match the current filter criteria."
          icon="bi-calendar-x"
        />
      ) : (
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Date & Time</th>
                  <th>Patient Name & ID</th>
                  <th>Doctor & Specialty</th>
                  <th>Reason</th>
                  <th>Status</th>
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
                      <small className="text-muted">{apt.patient_number}</small>
                    </td>
                    <td>
                      <div className="fw-semibold text-primary">{apt.doctor_name}</div>
                      <small className="text-muted">{apt.department_name}</small>
                    </td>
                    <td style={{ maxWidth: '180px' }} className="text-truncate">
                      {apt.reason_for_visit}
                    </td>
                    <td>
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {apt.status === 'BOOKED' && (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => handleCheckIn(apt.id)}
                            title="Check-in patient"
                          >
                            <i className="bi bi-box-arrow-in-right me-1"></i> Check In
                          </button>
                        )}
                        {['BOOKED', 'CHECKED_IN'].includes(apt.status) && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleCancel(apt.id)}
                            title="Cancel appointment"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book on Behalf Modal */}
      {isBookModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Book Appointment for Patient</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsBookModalOpen(false)}></button>
              </div>
              <form onSubmit={handleCreateAppointment}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Select Patient *</label>
                      <select
                        className="form-select"
                        value={bookData.patient}
                        onChange={(e) => setBookData({ ...bookData, patient: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Patient --</option>
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name} ({p.patient_number})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Select Doctor *</label>
                      <select
                        className="form-select"
                        value={bookData.doctor}
                        onChange={(e) => handleBookDoctorChange(e.target.value, bookData.appointment_date)}
                        required
                      >
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Appointment Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={bookData.appointment_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleBookDoctorChange(bookData.doctor, e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Available Doctor Slots</label>
                      {slotsLoading ? (
                        <LoadingSpinner message="Checking doctor schedule..." />
                      ) : !bookData.doctor ? (
                        <p className="text-muted small">Please select a doctor and date first.</p>
                      ) : availableSlots.length === 0 ? (
                        <div className="alert alert-warning py-2 small">No slots open on this date.</div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {availableSlots.map((slot, idx) => {
                            const isSelected = bookData.start_time === slot.start_time;
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
                                onClick={() => setBookData({ ...bookData, start_time: slot.start_time, end_time: slot.end_time })}
                              >
                                {slot.start_time} - {slot.end_time}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {bookData.start_time && (
                        <div className="mt-2 text-success small fw-semibold">
                          Selected Slot: {bookData.start_time} - {bookData.end_time}
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Reason for Visit *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bookData.reason_for_visit}
                        onChange={(e) => setBookData({ ...bookData, reason_for_visit: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsBookModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!bookData.start_time}>
                    Confirm Reservation
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

export default ReceptionAppointmentsPage;
