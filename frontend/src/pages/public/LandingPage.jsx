import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { departmentsApi, doctorsApi } from '../../api';

export const LandingPage = () => {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, docRes] = await Promise.all([
          departmentsApi.list(),
          doctorsApi.list()
        ]);
        setDepartments(deptRes.data.results || deptRes.data || []);
        setDoctors(docRes.data.results || docRes.data || []);
      } catch (err) {
        console.error("Failed to load landing data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Demo Disclaimer Top Alert */}
      <div className="bg-warning-subtle text-warning-emphasis py-2 px-3 text-center border-bottom border-warning small">
        <i className="bi bi-info-circle-fill me-1"></i>
        <strong>Portfolio Demo:</strong> This Healthcare Management System uses synthetic demo data and simulated clinical records for evaluation purposes only.
      </div>

      {/* Hero Section */}
      <section className="bg-primary text-white py-5 position-relative overflow-hidden">
        <div className="container py-lg-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge bg-white text-primary mb-3 px-3 py-2 fw-semibold">
                Integrated Healthcare Ecosystem
              </span>
              <h1 className="display-4 fw-bold mb-3">
                Modern Healthcare, Seamless Collaboration
              </h1>
              <p className="lead mb-4 text-white-50">
                Experience unified patient registration, doctor schedule availability,
                atomic appointment booking, doctor consultations, and pharmacy FEFO stock dispensing.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/patient/book" className="btn btn-warning btn-lg fw-bold text-dark px-4 shadow">
                  <i className="bi bi-calendar-plus me-2"></i> Book Appointment
                </Link>
                <Link to="/doctors" className="btn btn-outline-light btn-lg px-4">
                  <i className="bi bi-person-badge me-2"></i> Find Doctors
                </Link>
                <Link to="/login" className="btn btn-light btn-lg text-primary px-4">
                  <i className="bi bi-box-arrow-in-right me-2"></i> Portal Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-5 text-center">
              <div className="card bg-white text-dark shadow-lg border-0 rounded-4 p-4 text-start">
                <h5 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check text-success fs-4"></i> Role-Based Workflows
                </h5>
                <ul className="list-unstyled mb-4">
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div><strong>Patients:</strong> Self-registration, real-time doctor availability & appointment booking.</div>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div><strong>Doctors:</strong> Availability schedule, consultation notes & e-prescriptions.</div>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div><strong>Receptionists:</strong> Patient check-in, search directory, schedule management.</div>
                  </li>
                  <li className="mb-2 d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div><strong>Pharmacists:</strong> FEFO dispensing, batch expiry tracking & low-stock alerts.</div>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-primary mt-1"></i>
                    <div><strong>Administrators:</strong> Clinic oversight, staff credentials & department control.</div>
                  </li>
                </ul>
                <div className="p-3 bg-light rounded-3 text-center">
                  <small className="text-muted d-block mb-2">Want to try out the roles right away?</small>
                  <Link to="/login" className="btn btn-sm btn-primary w-100 fw-bold">
                    Open Interactive Demo Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Clinical Departments & Specialties</h2>
            <p className="text-muted">Multi-specialty outpatient clinics staffed by qualified physicians.</p>
          </div>
          <div className="row g-4">
            {departments.slice(0, 6).map((dept) => (
              <div key={dept.id} className="col-md-4">
                <div className="card h-100 border-0 shadow-sm rounded-3 hover-shadow transition">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="badge bg-primary-subtle text-primary fs-6 px-3 py-2 rounded-pill">
                        {dept.name}
                      </span>
                      <small className="text-muted">{dept.doctors_count || 1} Doctor(s)</small>
                    </div>
                    <p className="text-muted small mb-3">{dept.description}</p>
                    <Link to={`/doctors?department=${dept.id}`} className="text-decoration-none fw-semibold text-primary">
                      View Specialists <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Our Consulting Specialists</h2>
              <p className="text-muted mb-0">Book direct appointments with verified medical professionals.</p>
            </div>
            <Link to="/doctors" className="btn btn-outline-primary">
              View All Doctors <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          <div className="row g-4">
            {doctors.slice(0, 3).map((doc) => (
              <div key={doc.id} className="col-md-4">
                <div className="card h-100 shadow-sm border-0 rounded-3">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '56px', height: '56px', fontSize: '1.2rem' }}>
                        {doc.full_name?.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">{doc.full_name}</h5>
                        <small className="text-primary fw-semibold">{doc.specialization}</small>
                      </div>
                    </div>
                    <div className="mb-3 small text-muted">
                      <div><i className="bi bi-mortarboard me-2 text-secondary"></i>{doc.qualifications}</div>
                      <div><i className="bi bi-clock-history me-2 text-secondary"></i>{doc.experience_years} Years Experience</div>
                      <div><i className="bi bi-cash me-2 text-secondary"></i>Consultation Fee: ${doc.consultation_fee}</div>
                    </div>
                    <p className="small text-muted mb-4">{doc.bio?.slice(0, 100)}...</p>
                    <Link to={`/patient/book?doctor=${doc.id}`} className="btn btn-primary w-100 fw-semibold">
                      <i className="bi bi-calendar-event me-1"></i> Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
