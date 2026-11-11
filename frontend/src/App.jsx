import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public & Shared Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import DoctorDirectoryPage from './pages/public/DoctorDirectoryPage';
import ProfilePage from './pages/public/ProfilePage';
import { UnauthorizedPage, NotFoundPage } from './pages/public/ErrorPages';

// Patient Portal
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import MyAppointmentsPage from './pages/patient/MyAppointmentsPage';
import MyPrescriptionsPage from './pages/patient/MyPrescriptionsPage';

// Doctor Portal
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorAvailabilityPage from './pages/doctor/DoctorAvailabilityPage';

// Receptionist Portal
import ReceptionDashboard from './pages/receptionist/ReceptionDashboard';
import PatientDirectoryPage from './pages/receptionist/PatientDirectoryPage';
import ReceptionAppointmentsPage from './pages/receptionist/ReceptionAppointmentsPage';

// Pharmacist Portal
import PharmacyDashboard from './pages/pharmacist/PharmacyDashboard';
import MedicineCatalogPage from './pages/pharmacist/MedicineCatalogPage';
import StockManagementPage from './pages/pharmacist/StockManagementPage';
import PrescriptionDispensingPage from './pages/pharmacist/PrescriptionDispensingPage';

// Admin Portal
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';
import DoctorManagementPage from './pages/admin/DoctorManagementPage';

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100 bg-body-tertiary">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/doctors" element={<DoctorDirectoryPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Shared Authenticated Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Patient Portal Routes */}
              <Route
                path="/patient"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/book"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT', 'RECEPTIONIST', 'ADMIN']}>
                    <BookAppointmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <MyAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/prescriptions"
                element={
                  <ProtectedRoute allowedRoles={['PATIENT']}>
                    <MyPrescriptionsPage />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Portal Routes */}
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/appointments"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                    <DoctorAppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/schedule"
                element={
                  <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                    <DoctorAvailabilityPage />
                  </ProtectedRoute>
                }
              />

              {/* Receptionist Portal Routes */}
              <Route
                path="/reception"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                    <ReceptionDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/patients"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN', 'DOCTOR']}>
                    <PatientDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reception/appointments"
                element={
                  <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                    <ReceptionAppointmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Pharmacist Portal Routes */}
              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACIST']}>
                    <PharmacyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/catalog"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN', 'DOCTOR']}>
                    <MedicineCatalogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/stock"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']}>
                    <StockManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/dispense"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']}>
                    <PrescriptionDispensingPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <StaffManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/departments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DepartmentManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/doctors"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DoctorManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/appointments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ReceptionAppointmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-top py-3 text-center text-muted small mt-auto">
            <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                &copy; {new Date().getFullYear()} CarePulse Healthcare Management System &bull; Portfolio Engineering Release
              </div>
              <div>
                <span className="text-secondary me-3">Python &bull; Django REST Framework &bull; React &bull; MySQL</span>
                <a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer" className="text-decoration-none">
                  <i className="bi bi-box-arrow-up-right me-1"></i> Swagger API Docs
                </a>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
