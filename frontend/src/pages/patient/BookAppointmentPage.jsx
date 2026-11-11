import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doctorsApi, departmentsApi, appointmentsApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';

export const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctor') || '');
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );

  const [slotData, setSlotData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('General Consultation');

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch departments & doctors
  useEffect(() => {
    const fetchDropdowns = async () => {
      setLoading(true);
      try {
        const [deptRes, docRes] = await Promise.all([
          departmentsApi.list(),
          doctorsApi.list({ is_available: true })
        ]);
        setDepartments(deptRes.data.results || deptRes.data || []);
        setDoctors(docRes.data.results || docRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  // When doctor or date changes, load slots
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlotData(null);
      setSelectedSlot(null);
      return;
    }

    const loadSlots = async () => {
      setSlotsLoading(true);
      setError('');
      try {
        const res = await doctorsApi.getSlots(selectedDoctorId, selectedDate);
        setSlotData(res.data);
        setSelectedSlot(null);
      } catch (err) {
        console.error("Failed to load doctor slots:", err);
        setError("Could not load schedule slots for the selected doctor/date.");
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [selectedDoctorId, selectedDate]);

  const selectedDoctor = doctors.find((d) => String(d.id) === String(selectedDoctorId));

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError("Please select a doctor.");
      return;
    }
    if (!selectedSlot) {
      setError("Please select an available time slot.");
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await appointmentsApi.book({
        doctor: parseInt(selectedDoctorId, 10),
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        reason_for_visit: reason,
      });

      setSuccess("Appointment booked successfully! Redirecting to appointments list...");
      setTimeout(() => {
        navigate('/patient/appointments');
      }, 1500);
    } catch (err) {
      console.error("Booking error:", err);
      const detail = err.response?.data?.start_time || err.response?.data?.detail || err.response?.data?.doctor || "Failed to book slot. It may have just been reserved by another patient.";
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = selectedDept
    ? doctors.filter((d) => String(d.department) === String(selectedDept))
    : doctors;

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-primary text-white p-4">
              <h4 className="fw-bold mb-1">Book a Doctor's Appointment</h4>
              <p className="text-white-50 small mb-0">Select your preferred specialist and choose an open consultation time slot.</p>
            </div>

            <div className="card-body p-4 p-md-5">
              <AlertMessage message={error} onDismiss={() => setError('')} />
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleBook}>
                {/* Step 1: Doctor & Department */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">1. Select Department & Doctor</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Department</label>
                    <select
                      className="form-select"
                      value={selectedDept}
                      onChange={(e) => {
                        setSelectedDept(e.target.value);
                        setSelectedDoctorId('');
                      }}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Consulting Doctor *</label>
                    <select
                      className="form-select"
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Doctor --</option>
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.full_name} ({doc.specialization}) - ${doc.consultation_fee}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDoctor && (
                    <div className="col-12">
                      <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{selectedDoctor.full_name}</strong> &bull; <span className="text-muted">{selectedDoctor.qualifications}</span>
                          <small className="d-block text-secondary">{selectedDoctor.specialization} &bull; {selectedDoctor.experience_years} years experience</small>
                        </div>
                        <span className="badge bg-primary fs-6">${selectedDoctor.consultation_fee}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Date & Available Slots */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">2. Choose Date & Open Slot</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Appointment Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Available Time Slots</label>
                    {slotsLoading ? (
                      <LoadingSpinner message="Checking real-time doctor availability..." />
                    ) : !selectedDoctorId ? (
                      <p className="text-muted small">Please select a doctor to view their schedule slots.</p>
                    ) : !slotData || slotData.slots?.length === 0 ? (
                      <div className="alert alert-warning py-3 small">
                        <i className="bi bi-calendar-x me-2"></i>
                        {slotData?.message || "No working hours scheduled or all slots are unavailable for this date."}
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {slotData.slots.map((slot, idx) => {
                          const isSelected = selectedSlot?.start_time === slot.start_time;
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
                                  : 'btn-light text-muted border-secondary-subtle disabled'
                              }`}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {slot.start_time} - {slot.end_time}
                              {!slot.is_available && (
                                <span className="d-block small" style={{ fontSize: '0.65rem' }}>
                                  ({slot.status})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {selectedSlot && (
                      <div className="mt-2 text-success small fw-semibold">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Selected: {selectedSlot.start_time} to {selectedSlot.end_time}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Reason for visit */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">3. Reason for Visit</h6>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Administrative Reason / Symptoms Summary *</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Brief description of the visit (e.g. routine checkup, persistent headache, follow-up)"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 fw-bold shadow-sm"
                  disabled={submitting || !selectedSlot}
                >
                  {submitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : (
                    <i className="bi bi-calendar-check me-2"></i>
                  )}
                  {submitting ? 'Confirming booking...' : 'Confirm Appointment Booking'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
