import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorsApi } from '../../api';
import { LoadingSpinner, AlertMessage } from '../../components/common/Feedback';

const WEEKDAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

export const DoctorAvailabilityPage = () => {
  const { user } = useAuth();
  const doctorId = user?.doctor_id;

  const [workingHours, setWorkingHours] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Working Hour State
  const [newSchedule, setNewSchedule] = useState({
    weekday: 0,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
  });

  // Add Exception/Leave State
  const [newException, setNewException] = useState({
    date: new Date().toISOString().split('T')[0],
    is_all_day: true,
    exception_type: 'BLOCKED',
    reason: 'Medical Conference / Scheduled Leave',
  });

  const fetchData = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const [hoursRes, excRes] = await Promise.all([
        doctorsApi.getWorkingHours(doctorId),
        doctorsApi.getExceptions(doctorId)
      ]);
      setWorkingHours(hoursRes.data.results || hoursRes.data || []);
      setExceptions(excRes.data.results || excRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load doctor schedule settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [doctorId]);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await doctorsApi.createWorkingHours(doctorId, newSchedule);
      setSuccess("Working hours saved successfully!");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add working hours.");
    }
  };

  const handleAddException = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await doctorsApi.createException(doctorId, newException);
      setSuccess("Schedule exception / leave recorded successfully!");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to record leave exception.");
    }
  };

  if (!doctorId) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning">
          Doctor profile was not found for this account. Please sign in as a doctor.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Availability Schedule & Leave Management</h2>
        <p className="text-muted">Configure your weekly clinic working hours and record blackout dates or leaves.</p>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />
      {success && <div className="alert alert-success alert-dismissible fade show">{success}</div>}

      <div className="row g-4">
        {/* Weekly Working Hours Panel */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-clock me-2"></i> Weekly Working Hours
              </h5>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <LoadingSpinner message="Loading hours..." />
              ) : workingHours.length === 0 ? (
                <div className="alert alert-info py-2 small">No regular working hours configured yet.</div>
              ) : (
                <div className="table-responsive mb-4">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Weekday</th>
                        <th>Hours</th>
                        <th>Slot Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workingHours.map((wh) => (
                        <tr key={wh.id}>
                          <td className="fw-bold">{wh.weekday_display}</td>
                          <td>{wh.start_time} - {wh.end_time}</td>
                          <td><span className="badge bg-secondary">{wh.slot_duration_minutes} mins</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">Add / Extend Working Hours</h6>
              <form onSubmit={handleAddSchedule}>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Day of Week</label>
                    <select
                      className="form-select form-select-sm"
                      value={newSchedule.weekday}
                      onChange={(e) => setNewSchedule({ ...newSchedule, weekday: parseInt(e.target.value, 10) })}
                    >
                      {WEEKDAYS.map((w) => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Slot Duration</label>
                    <select
                      className="form-select form-select-sm"
                      value={newSchedule.slot_duration_minutes}
                      onChange={(e) => setNewSchedule({ ...newSchedule, slot_duration_minutes: parseInt(e.target.value, 10) })}
                    >
                      <option value="15">15 Minutes</option>
                      <option value="20">20 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Start Time</label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">End Time</label>
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-sm btn-primary w-100 fw-semibold">
                  Save Working Hours
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Schedule Exceptions / Leave Panel */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-danger text-white py-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-calendar-x me-2"></i> Leave & Blocked Exceptions
              </h5>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <LoadingSpinner message="Loading exceptions..." />
              ) : exceptions.length === 0 ? (
                <div className="alert alert-light text-muted border py-2 small mb-4">
                  No upcoming leaves or schedule exceptions recorded.
                </div>
              ) : (
                <div className="table-responsive mb-4">
                  <table className="table table-sm table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exceptions.map((exc) => (
                        <tr key={exc.id}>
                          <td className="fw-bold">{exc.date}</td>
                          <td>
                            <span className="badge bg-danger-subtle text-danger border border-danger">
                              {exc.is_all_day ? 'All-Day Block' : 'Partial Block'}
                            </span>
                          </td>
                          <td className="small text-muted">{exc.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3">Record Leave / Block Date</h6>
              <form onSubmit={handleAddException}>
                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Date *</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={newException.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Duration</label>
                    <div className="form-check mt-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newException.is_all_day}
                        onChange={(e) => setNewException({ ...newException, is_all_day: e.target.checked })}
                        id="allDayCheck"
                      />
                      <label className="form-check-label small" htmlFor="allDayCheck">
                        All Day Leave
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Staff Reason (Internal Notes)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newException.reason}
                      onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                      placeholder="e.g. Annual leave, conference, personal emergency"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-sm btn-outline-danger w-100 fw-semibold">
                  Record Blocked Leave
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailabilityPage;
