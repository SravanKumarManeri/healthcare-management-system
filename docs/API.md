# Healthcare Management System (HMS) - REST API Specification

CarePulse HMS provides a production-grade RESTful API built with Django REST Framework (DRF), SimpleJWT token authentication, and OpenAPI 3.0 schemas generated via `drf-spectacular`.

Interactive Swagger UI documentation is available locally at:
- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **Redoc UI:** `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI 3.0 Schema:** `http://127.0.0.1:8000/api/schema/`

---

## 1. Authentication & Security Headers

All authenticated endpoints require a JSON Web Token (JWT) transmitted via the standard `Authorization` header:
```http
Authorization: Bearer <access_token>
```

Tokens are obtained by authenticating against `/api/auth/token/`. Access tokens are valid for 60 minutes and refresh tokens are valid for 7 days.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Endpoint Group | Public | Patient | Doctor | Receptionist | Pharmacist | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Auth Register** (`POST /api/auth/register/`) | Yes | No | No | No | No | No |
| **Auth Login / Token** (`POST /api/auth/token/`) | Yes | Yes | Yes | Yes | Yes | Yes |
| **Current User** (`GET, PATCH /api/auth/me/`) | No | Own | Own | Own | Own | Own |
| **Staff Accounts** (`/api/auth/users/`) | No | No | No | No | No | Yes |
| **Departments** (`GET /api/departments/`) | Yes | Yes | Yes | Yes | Yes | Yes |
| **Departments Edit** (`POST, PATCH /api/departments/`) | No | No | No | No | No | Yes |
| **Doctor Directory** (`GET /api/doctors/`) | Yes | Yes | Yes | Yes | Yes | Yes |
| **Doctor Availability Slots** (`GET /api/doctors/{id}/availability/`) | Yes | Yes | Yes | Yes | Yes | Yes |
| **Doctor Working Hours** (`/api/doctors/{id}/working-hours/`) | No | No | Own | No | No | Yes |
| **Patients List & Search** (`GET /api/patients/`) | No | Own | Yes | Yes | Yes | Yes |
| **Patient Registration** (`POST /api/patients/`) | No | No | No | Yes | No | Yes |
| **Patient Detail / Update** (`/api/patients/{id}/`) | No | Own | Assigned | Yes | No | Yes |
| **Appointments List** (`GET /api/appointments/`) | No | Own | Assigned | All | All | All |
| **Book Appointment** (`POST /api/appointments/`) | No | Yes | No | Yes | No | Yes |
| **Reschedule Appointment** (`PATCH /api/appointments/{id}/reschedule/`) | No | Own | No | Yes | No | Yes |
| **Check In Patient** (`POST /api/appointments/{id}/check-in/`) | No | No | No | Yes | No | Yes |
| **Complete Appointment** (`POST /api/appointments/{id}/complete/`) | No | No | Own | No | No | Yes |
| **Cancel Appointment** (`POST /api/appointments/{id}/cancel/`) | No | Own | Own | Yes | No | Yes |
| **Consultation Create** (`POST /api/consultations/`) | No | No | Assigned | No | No | Yes |
| **Consultation View** (`GET /api/consultations/{id}/`) | No | Own | Assigned | No | No | Yes |
| **Prescriptions List** (`GET /api/prescriptions/`) | No | Own | Written | No | All | All |
| **Prescription Create** (`POST /api/prescriptions/`) | No | No | Assigned | No | No | Yes |
| **Medicine Catalogue** (`GET, POST /api/medicines/`) | No | No | Read | Read | Full | Full |
| **Receive Stock Batch** (`POST /api/pharmacy/stock/receive/`) | No | No | No | No | Yes | Yes |
| **Adjust Stock** (`POST /api/pharmacy/stock/adjust/`) | No | No | No | No | Yes | Yes |
| **Dispense Prescription (FEFO)** (`POST /api/pharmacy/prescriptions/{id}/dispense/`) | No | No | No | No | Yes | Yes |
| **Stock Movement Audit Log** (`GET /api/pharmacy/movements/`) | No | No | No | No | Yes | Yes |
| **Admin Dashboard** (`GET /api/dashboards/admin/`) | No | No | No | No | No | Yes |
| **Doctor Dashboard** (`GET /api/dashboards/doctor/`) | No | No | Yes | No | No | No |
| **Reception Dashboard** (`GET /api/dashboards/reception/`) | No | No | No | Yes | No | No |
| **Pharmacy Dashboard** (`GET /api/dashboards/pharmacy/`) | No | No | No | No | Yes | No |
| **Patient Dashboard** (`GET /api/dashboards/patient/`) | No | Yes | No | No | No | No |

---

## 3. Endpoints Detail Directory (57 Endpoints)

### 3.1 Authentication & Profile (`/api/auth/`)
- `POST /api/auth/register/` - Patient self-registration. Enforces `role=PATIENT` and creates `PatientProfile`.
- `POST /api/auth/token/` - Obtain JWT access and refresh token pair.
- `POST /api/auth/token/refresh/` - Refresh JWT access token.
- `GET /api/auth/me/` - Retrieve profile of currently authenticated user.
- `PATCH /api/auth/me/` - Update own first name, last name, phone, or email.
- `POST /api/auth/change-password/` - Securely change account password.
- `GET /api/auth/users/` - Admin user list with filtering by role and active status.
- `POST /api/auth/users/` - Admin creates privileged staff accounts (DOCTOR, RECEPTIONIST, PHARMACIST, ADMIN).
- `GET /api/auth/users/{id}/` - Admin user detail.
- `PATCH /api/auth/users/{id}/` - Admin update or toggle account activation status.

### 3.2 Departments & Services (`/api/departments/`)
- `GET /api/departments/` - List clinical departments with doctor counts.
- `POST /api/departments/` - Create a department (Admin only).
- `GET /api/departments/{id}/` - Retrieve department details.
- `PATCH /api/departments/{id}/` - Update department scope/description (Admin only).
- `DELETE /api/departments/{id}/` - Remove department (Admin only).

### 3.3 Doctors & Scheduling (`/api/doctors/`)
- `GET /api/doctors/` - Filter and search active consulting doctors.
- `POST /api/doctors/` - Create doctor profile (Admin only).
- `GET /api/doctors/{id}/` - Doctor details, bio, qualifications, and consultation fee.
- `PATCH /api/doctors/{id}/` - Update doctor profile (Admin or the Doctor themselves).
- `GET /api/doctors/{id}/availability/?date=YYYY-MM-DD` - Real-time slot calculator taking into account weekly hours, leave exceptions, and existing bookings.
- `GET /api/doctors/{id}/working-hours/` - List regular weekly working hours.
- `POST /api/doctors/{id}/working-hours/` - Configure weekday working hours and slot durations.
- `GET /api/doctors/{id}/exceptions/` - View scheduled leave dates and blackout windows.
- `POST /api/doctors/{id}/exceptions/` - Record all-day leave or partial hour blocks.

### 3.4 Patient Management (`/api/patients/`)
- `GET /api/patients/` - List and search patient directory. Scoped to own record for patients.
- `POST /api/patients/` - Receptionist or Admin registers walk-in patient. Automatically issues unique `patient_number`.
- `GET /api/patients/{id}/` - Patient profile detail with object-level permission check.
- `PATCH /api/patients/{id}/` - Update patient contact and emergency details.

### 3.5 Appointments (`/api/appointments/`)
- `GET /api/appointments/` - List appointments with filters (`doctor`, `patient`, `appointment_date`, `status`). Scoped to role.
- `POST /api/appointments/` - Concurrency-safe atomic appointment booking with database locking to prevent double-booking.
- `GET /api/appointments/{id}/` - Appointment detail.
- `PATCH /api/appointments/{id}/reschedule/` - Reschedule appointment with slot availability validation.
- `POST /api/appointments/{id}/cancel/` - Cancel appointment with reason audit.
- `POST /api/appointments/{id}/check-in/` - Receptionist checks in patient upon clinic arrival.
- `POST /api/appointments/{id}/complete/` - Consulting doctor marks appointment as completed.

### 3.6 Consultations & Clinical Notes (`/api/consultations/`)
- `GET /api/consultations/` - List consultation notes (role-scoped; patients read-only, staff only authorized).
- `POST /api/consultations/` - Consulting doctor creates clinical note (symptoms, examination, diagnosis, advice, follow-up date).
- `GET /api/consultations/{id}/` - Consultation detail.
- `PATCH /api/consultations/{id}/` - Update draft or existing consultation note.

### 3.7 Prescriptions (`/api/prescriptions/`)
- `GET /api/prescriptions/` - List prescriptions (patients see own, doctors see written, pharmacists see all).
- `POST /api/prescriptions/` - Doctor issues e-prescription with multiple medication items.
- `GET /api/prescriptions/{id}/` - Prescription detail and medication items.

### 3.8 Pharmacy & Inventory (`/api/pharmacy/` & `/api/medicines/`)
- `GET /api/medicines/` - Search medicine catalogue and view batch stock totals.
- `POST /api/medicines/` - Create medicine entry (Pharmacist/Admin).
- `GET /api/medicines/{id}/` - Medicine detail.
- `PATCH /api/medicines/{id}/` - Update medicine details.
- `GET /api/pharmacy/low-stock/` - Low stock count and batches expiring within 30 days.
- `POST /api/pharmacy/stock/receive/` - Receive new supplier batch with quantity, batch number, and expiry date.
- `POST /api/pharmacy/stock/adjust/` - Adjust stock quantities for write-offs or physical reconciliations (prevents negative stock).
- `POST /api/pharmacy/prescriptions/{id}/dispense/` - Execute atomic First-Expiry-First-Out (FEFO) dispensing.
- `GET /api/pharmacy/movements/` - Complete audit trail of stock movements.

### 3.9 Dashboards (`/api/dashboards/`)
- `GET /api/dashboards/admin/` - Real-time metrics for Administrators.
- `GET /api/dashboards/doctor/` - Assigned patient counts and today's schedule for Doctors.
- `GET /api/dashboards/reception/` - Today's appointment queue and status counts for Receptionists.
- `GET /api/dashboards/pharmacy/` - Pending prescriptions and stock alerts for Pharmacists.
- `GET /api/dashboards/patient/` - Upcoming visits and active prescriptions for Patients.

---

## 4. Error Response Format

API errors return standardized JSON payloads:
```json
{
  "detail": "Descriptive error message explaining the permission or validation failure."
}
```
Validation errors on specific fields return a key-value dictionary of field names to lists of errors:
```json
{
  "start_time": ["This time slot is no longer available. Please select another slot."]
}
```
