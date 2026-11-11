# Implementation Plan: Healthcare Management System (HMS)

## Architecture Overview
- **Backend**: Django 5.x + Django REST Framework (DRF) with custom user model (`accounts.User`), JWT (`simplejwt`), OpenAPI/Swagger docs (`drf-spectacular`), `django-cors-headers`, `django-filter`, MySQL 8.x support via `PyMySQL`/`mysqlclient` (with automated test fallback).
- **Frontend**: React 18 / Vite SPA with React Router v6, Axios, modern responsive styling (Bootstrap 5 + custom clean healthcare theme), role-aware navigation, route guards, notifications, modal dialogs, and interactive dashboards.
- **Database Schema**: Fully normalized models across 7 apps (`accounts`, `patients`, `doctors`, `appointments`, `consultations`, `pharmacy`, `dashboards`) with database constraints, indexes, timestamps, and atomic transactions.
- **Security & RBAC**: Strict backend permission classes (`IsAdmin`, `IsDoctor`, `IsReceptionist`, `IsPharmacist`, `IsPatient`, object-level ownership checks), password hashing, CORS whitelist, parameter validation, rate limiting, and audit history.
- **Portability & Delivery**: Automated test suite, production Vite build, Postman collection with dynamic environment variables, seed data command (`python manage.py seed_data`), AWS EC2 deployment guide (`docs/deployment-aws-ec2.md`), API specification (`docs/API.md`), Architecture document (`docs/architecture.md`), and comprehensive `README.md`.

---

## Implementation Phases & Checklist

### Phase 1: Environment & Workspace Setup
- [x] Create project structure in `C:\Users\ADMIN\.gemini\antigravity\scratch\healthcare-management-system`.
- [x] Author `IMPLEMENTATION_PLAN.md`.
- [ ] Initialize Python virtual environment and configure backend dependencies (`requirements.txt`).
- [ ] Setup backend `.env.example` and default `.env`.
- [ ] Initialize React + Vite frontend and install dependencies (`axios`, `react-router-dom`, `bootstrap`, `bootstrap-icons`, `lucide-react`).

### Phase 2: Backend Core & Data Models
- [ ] Configure Django `config/settings.py` (custom User model, JWT, REST Framework, Spectacular, Database config supporting MySQL 8 with SQLite fallback for test runner, CORS).
- [ ] Create apps:
  - `accounts`: Custom User model (`role` choices: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PHARMACIST`, `PATIENT`), JWT auth views, registration, profile update.
  - `patients`: `PatientProfile` model, auto-generated unique `patient_number`, scoped views.
  - `doctors`: `Department`, `DoctorProfile`, `DoctorAvailability`, `AvailabilityException`.
  - `appointments`: `Appointment`, `AppointmentStatusHistory`, slot generation, atomic booking, concurrency & double-booking prevention.
  - `consultations`: `Consultation` model linked to appointment/doctor/patient, draft/final status.
  - `pharmacy`: `Medicine`, `MedicineBatch`, `StockMovement`, `Prescription`, `PrescriptionItem`, `DispensingRecord`, atomic FEFO dispensing, inventory safety.
  - `dashboards`: Aggregated real-time metrics for each of the 5 roles.
- [ ] Create and run initial database migrations.

### Phase 3: REST API & Permission Layer
- [ ] Implement robust serializers with input sanitization, field-level validations, and read-only field restrictions.
- [ ] Implement backend permission classes (`IsAdminUser`, `IsDoctor`, `IsReceptionist`, `IsPharmacist`, `IsPatient`, `IsOwnerOrStaff`).
- [ ] Implement 35+ working endpoints across Auth, Doctors, Patients, Appointments, Consultations, Pharmacy, and Dashboards.
- [ ] Implement Swagger UI (`/api/docs/`) and OpenAPI schema (`/api/schema/`).
- [ ] Create management command `python manage.py seed_data` with realistic synthetic demo data across all 5 roles.

### Phase 4: Frontend Development
- [ ] Configure Axios client with JWT interceptor, token storage, and automatic logout on 401.
- [ ] Set up React Router with public routes, auth routes, and `ProtectedRoute` role-guards.
- [ ] Implement Navigation / Header / Sidebar dynamic per active user role.
- [ ] Build UI Screens:
  - **Public**: Home/landing, doctor directory with search and department filtering, doctor profile & slots, login, patient self-registration.
  - **Patient**: Dashboard, upcoming appointments, book appointment modal/stepper, appointment history, prescriptions & medical records.
  - **Receptionist**: Reception dashboard, patient directory & registration, appointment schedule & queue, check-in/confirm/cancel/reschedule actions.
  - **Doctor**: Doctor dashboard, assigned appointment list, consultation note editor, prescription item builder, schedule management.
  - **Pharmacist**: Pharmacy dashboard, medicine catalogue, batch stock receipt, stock adjustment, prescriptions awaiting dispensing, FEFO dispensing modal.
  - **Admin**: Admin dashboard, user & staff management, department management, doctor profile oversight, system-wide appointment oversight, pharmacy stock monitoring.

### Phase 5: Testing, Postman & Verification
- [ ] Write extensive automated Django test suites covering:
  - Auth, role isolation & privilege escalation prevention.
  - Unique patient numbering and record scoping.
  - Doctor slot generation and overlapping schedule prevention.
  - Appointment booking, double-booking prevention, concurrency safety, cancellation rules.
  - Consultation creation and edit restrictions.
  - Pharmacy batch stock validation, FEFO selection, negative stock rejection, dispensing idempotency.
- [ ] Run backend tests and verify 100% pass rate.
- [ ] Build frontend bundle with `npm run build` and ensure clean zero-error production build.
- [ ] Generate comprehensive Postman collection `postman/Healthcare_Management_System.postman_collection.json`.

### Phase 6: Documentation & Handover
- [ ] Write `docs/architecture.md`.
- [ ] Write `docs/API.md`.
- [ ] Write `docs/deployment-aws-ec2.md`.
- [ ] Write root `README.md` with complete setup instructions, troubleshooting, environment table, role matrix, and verified commands.
- [ ] Deliver final handover summary report.
