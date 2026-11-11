import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { doctorsApi, departmentsApi } from '../../api';
import { LoadingSpinner, EmptyState, AlertMessage } from '../../components/common/Feedback';

export const DoctorDirectoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDept, setSelectedDept] = useState(searchParams.get('department') || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Availability modal state
  const [activeDoctor, setActiveDoctor] = useState(null);
  const [slotDate, setSlotDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotData, setSlotData] = useState(null);

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [deptRes, docRes] = await Promise.all([
          departmentsApi.list(),
          doctorsApi.list({ department: selectedDept || undefined, search: searchQuery || undefined })
        ]);
        setDepartments(deptRes.data.results || deptRes.data || []);
        setDoctors(docRes.data.results || docRes.data || []);
      } catch (err) {
        console.error("Failed to load doctor directory:", err);
        setError("Failed to load doctors list. Please check backend connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [selectedDept]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await doctorsApi.list({
        department: selectedDept || undefined,
        search: searchQuery || undefined
      });
      setDoctors(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openSlotChecker = async (doctor) => {
    setActiveDoctor(doctor);
    setSlotsLoading(true);
    try {
      const res = await doctorsApi.getSlots(doctor.id, slotDate);
      setSlotData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = async (newDate) => {
    setSlotDate(newDate);
    if (!activeDoctor) return;
    setSlotsLoading(true);
    try {
      const res = await doctorsApi.getSlots(activeDoctor.id, newDate);
      setSlotData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Doctor Directory</h2>
        <p className="text-muted">Browse specialists, check real-time availability slots, and book your visit.</p>
      </div>

      <AlertMessage message={error} onDismiss={() => setError('')} />

      {/* Filters Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-light">
        <form onSubmit={handleSearch} className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by doctor name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSearchParams(e.target.value ? { department: e.target.value } : {});
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1">
              Filter Doctors
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSelectedDept('');
                setSearchQuery('');
                setSearchParams({});
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Searching verified doctors..." />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors matched your criteria"
          message="Try selecting another department or clearing search keywords."
          icon="bi-search"
        />
      ) : (
        <div className="row g-4">
          {doctors.map((doc) => (
            <div key={doc.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 rounded-3">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '56px', height: '56px', fontSize: '1.2rem' }}>
                      {doc.full_name?.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">{doc.full_name}</h5>
                      <span className="badge bg-primary-subtle text-primary border border-primary px-2 py-1">
                        {doc.department_name}
                      </span>
                    </div>
                  </div>

                  <div className="small text-muted mb-3 flex-grow-1">
                    <div className="mb-1"><i className="bi bi-award me-2 text-secondary"></i><strong>Spec:</strong> {doc.specialization}</div>
                    <div className="mb-1"><i className="bi bi-mortarboard me-2 text-secondary"></i><strong>Qual:</strong> {doc.qualifications}</div>
                    <div className="mb-1"><i className="bi bi-clock-history me-2 text-secondary"></i><strong>Exp:</strong> {doc.experience_years} years</div>
                    <div className="mb-1"><i className="bi bi-cash me-2 text-secondary"></i><strong>Fee:</strong> ${doc.consultation_fee}</div>
                    {doc.bio && <p className="text-secondary mt-2 mb-0">{doc.bio}</p>}
                  </div>

                  <div className="d-flex gap-2 mt-auto pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm flex-grow-1"
                      onClick={() => openSlotChecker(doc)}
                    >
                      <i className="bi bi-calendar-range me-1"></i> Check Slots
                    </button>
                    <Link
                      to={`/patient/book?doctor=${doc.id}`}
                      className="btn btn-primary btn-sm flex-grow-1 fw-semibold"
                    >
                      <i className="bi bi-calendar-plus me-1"></i> Book
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Availability Modal */}
      {activeDoctor && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-clock-history me-2"></i> Availability for {activeDoctor.full_name}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveDoctor(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 align-items-center mb-4">
                  <div className="col-auto">
                    <label className="form-label fw-bold mb-0">Select Date:</label>
                  </div>
                  <div className="col-auto">
                    <input
                      type="date"
                      className="form-control"
                      value={slotDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                  </div>
                  <div className="col text-end">
                    <span className="badge bg-light text-dark border p-2">
                      Department: {activeDoctor.department_name}
                    </span>
                  </div>
                </div>

                {slotsLoading ? (
                  <LoadingSpinner message="Calculating available slots..." />
                ) : !slotData || slotData.slots?.length === 0 ? (
                  <div className="alert alert-warning text-center">
                    <i className="bi bi-calendar-x fs-3 d-block mb-2"></i>
                    {slotData?.message || 'No scheduled working hours or all slots are unavailable on this date.'}
                  </div>
                ) : (
                  <div>
                    <h6 className="fw-bold mb-3 text-secondary">
                      Available Time Slots on {slotData.date}:
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {slotData.slots.map((s, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded border text-center ${
                            s.is_available
                              ? 'bg-success-subtle text-success border-success'
                              : 'bg-light text-muted border-secondary opacity-50'
                          }`}
                          style={{ minWidth: '100px' }}
                        >
                          <div className="fw-bold">{s.start_time} - {s.end_time}</div>
                          <small style={{ fontSize: '0.75rem' }}>
                            {s.is_available ? 'Available' : (s.status || 'Booked')}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveDoctor(null)}>
                  Close
                </button>
                <Link
                  to={`/patient/book?doctor=${activeDoctor.id}&date=${slotDate}`}
                  className="btn btn-primary"
                  onClick={() => setActiveDoctor(null)}
                >
                  Proceed to Book This Doctor
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDirectoryPage;
