# CarePulse Healthcare Management System (HMS)

> **Portfolio Positioning:** Full-Stack Healthcare Management System \| Python 3, Django 5, Django REST Framework, React (Vite), MySQL 8.x, AWS EC2

A responsive, production-ready Healthcare Management System (HMS) designed for outpatient clinics, polyclinics, and multi-specialty healthcare centers. The system centralizes patient self-registration, doctor schedules and dynamic slot computation, concurrency-safe appointment booking, clinical consultation notes, e-prescriptions, and pharmacy inventory management with automated First-Expiry-First-Out (FEFO) dispensing.

---

## ⚡ Quick Start: How to Run the Services Manually

To run the full-stack application manually on your local computer, open two separate terminal windows:

### Terminal 1 — Start Backend Server (Django REST Framework)
```bash
cd backend

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# Apply migrations and load initial sample data (if not already done)
python manage.py migrate
python manage.py seed_data

# Start backend server on port 8000
python manage.py runserver 127.0.0.1:8000
```
*Backend API and Swagger UI will be running at `http://127.0.0.1:8000/api/docs/`.*

### Terminal 2 — Start Frontend Server (React + Vite)
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```
*Frontend Web Portal will be running at `http://127.0.0.1:5173/`.*

> **Test Credentials:**  
> On the login page (`http://127.0.0.1:5173/login`), click any of the **Demo Quick Login** buttons (Admin, Doctor, Reception, Pharmacy, Patient) to sign in instantly without typing passwords!

---

## 1. Project Overview & Clinical Limitations

### Scope
- **Patient Registration & Self-Service Portal:** Unique system-generated patient identifiers (`PAT-XXXXXXXX`), profile management, appointment booking, and visit history.
- **Doctor Schedule & Availability Engine:** Weekly recurring hours, exception/leave blocking, real-time available slot generation.
- **Appointment Management:** Concurrency-safe atomic slot reservation using database locks (`select_for_update`), check-in, completion, and rescheduling.
- **Clinical Consultations & e-Prescriptions:** Authorized physician consultation records (symptoms, examination, diagnosis, advice, follow-up date) and structured medication orders.
- **Pharmacy & Inventory:** Multi-batch tracking, stock receipt, adjustments, low-stock and expiry warnings, and transactional FEFO dispensing.
- **Role-Aware Dashboards:** Dedicated real-time analytics for all 5 roles.

### Non-Clinical Portfolio Disclaimer
> [!IMPORTANT]
> This application is built as a portfolio and demonstration project. It is **not** a certified Electronic Health Record (EHR) system, medical device, or diagnostic platform under FDA, CE, HIPAA, or equivalent medical software regulations. All clinical diagnostic terms, prescription dosages, and patient records are synthetic illustrations. Clinical decisions must always be made by licensed medical practitioners.

---

## 2. Features by User Role

### 1. Administrator (`ADMIN`)
- System-wide executive dashboard with active patients, doctors, staff counts, and today's appointment breakdown.
- Staff credential management: create, review, activate, and deactivate Doctor, Receptionist, Pharmacist, and Admin accounts.
- Clinical department and specialty configuration.
- Doctor profile oversight: manage consultation fees, qualifications, and active booking availability.
- Pharmacy stock oversight and audit logs.

### 2. Consulting Doctor (`DOCTOR`)
- Doctor dashboard: today's assigned appointments, patient queue, and clinical metrics.
- Availability management: configure weekly working hours (e.g. Mon–Fri 09:00–17:00, 30-minute intervals) and add leave/blackout exceptions.
- Clinical consultation notes: record symptoms, physical examination findings, clinical diagnosis, advice, and follow-up dates.
- E-prescriptions: formulate medication items (medicine, dosage instructions, frequency, duration, quantity).

### 3. Front-Desk Receptionist (`RECEPTIONIST`)
- Operational reception desk: track today's scheduled, checked-in, completed, and cancelled patients.
- Patient registry: search patients by ID (`PAT-`), name, or phone; register walk-in patients.
- Appointment queue: check in arriving patients, reschedule bookings, cancel appointments, or book appointments on behalf of patients.
- Doctor schedule lookup: inspect open consultation windows across departments.

### 4. Pharmacist (`PHARMACIST`)
- Pharmacy dashboard: prescriptions awaiting dispensing, low-stock alerts, and batch expiry warnings.
- Medicine catalogue: search by name, generic formulation, or SKU; add new formulations.
- Stock management: receive supplier inventory batches (batch number, expiry date, quantity received) and perform adjustments.
- Prescription fulfillment: automated First-Expiry-First-Out (FEFO) batch allocation and transactional stock deduction.

### 5. Patient (`PATIENT`)
- Self-registration with auto-generated patient identifier.
- Browse verified doctor directory filtered by clinical department or specialization.
- Live slot selector: choose date, view open consultation slots, and book visits.
- My Appointments: view upcoming and past appointments; cancel or reschedule eligible bookings.
- My Prescriptions: view prescribed medications, dosage instructions, and dispensing status.

---

## 3. Technology Stack

- **Backend:** Python 3.11+ / 3.14, Django 5.2, Django REST Framework 3.18, `djangorestframework-simplejwt` 5.5, `drf-spectacular` 0.30 (OpenAPI 3.0 & Swagger UI), `django-cors-headers`, `django-filter`, `PyMySQL` 1.2 / `mysqlclient`.
- **Primary Database:** MySQL 8.x (with automated test SQLite fallback).
- **Frontend:** React 18, Vite 6 / 8, React Router v6, Axios, Bootstrap 5.3, Bootstrap Icons.
- **Architecture:** Decoupled RESTful API, stateless JWT authorization, database transaction isolation (`transaction.atomic()` & `select_for_update()`).

---

## 4. Prerequisites & Compatible Versions

| Component | Minimum Version | Verified Tested Version | Notes |
| :--- | :---: | :---: | :--- |
| **Python** | 3.11+ | 3.14.2 | Backend runtime |
| **Node.js** | 18.0+ | 24.12.0 | Frontend build tooling |
| **npm** | 9.0+ | 11.6.2 | Frontend package manager |
| **MySQL Server** | 8.0+ | 8.0 / 8.4 | Primary production/local database |

---

## 5. Directory Navigation

Navigate to the workspace root:
```bash
cd healthcare-management-system
```

Project structure:
```text
healthcare-management-system/
├── backend/                  # Django REST Framework backend
│   ├── accounts/             # Custom User model, RBAC, JWT auth
│   ├── patients/             # Patient profiles & numbering
│   ├── doctors/              # Departments, profiles, availability
│   ├── appointments/         # Atomic scheduling & concurrency locks
│   ├── consultations/        # Clinical notes & diagnoses
│   ├── pharmacy/             # Medicines, batches, FEFO dispensing
│   ├── dashboards/           # Role-specific analytics
│   ├── config/               # Project settings & URL routing
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React (Vite) single-page application
│   ├── src/
│   │   ├── api/              # Axios service layer
│   │   ├── context/          # AuthContext & token management
│   │   ├── components/       # Reusable components & Navbar
│   │   ├── pages/            # Role-scoped pages (Patient, Doctor, etc.)
│   │   └── App.jsx           # Route definitions & guards
│   ├── package.json
│   └── .env.example
├── docs/                     # Full engineering documentation
│   ├── API.md                # Endpoint tables & role matrix
│   ├── architecture.md       # Architectural design & ERD diagrams
│   └── deployment-aws-ec2.md # AWS EC2 & RDS deployment guide
├── postman/                  # Postman test collection
│   └── Healthcare_Management_System.postman_collection.json
├── IMPLEMENTATION_PLAN.md    # Implementation roadmap & checklist
└── README.md
```

---

## 6. MySQL Database Setup

Start your local MySQL 8.x service and execute the SQL commands below to establish the database and least-privilege application user:

```sql
CREATE DATABASE healthcare_management_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'hms_app_user'@'localhost'
  IDENTIFIED WITH caching_sha2_password BY 'change-this-local-password';

GRANT ALL PRIVILEGES ON healthcare_management_db.*
  TO 'hms_app_user'@'localhost';

FLUSH PRIVILEGES;
```

---

## 7. Backend Setup & Activation

### Step 1: Create and Activate Virtual Environment

**Windows PowerShell:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows CMD:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### Backend Environment Variables Reference:
| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | random secret string | Cryptographic signing key |
| `DJANGO_DEBUG` | `True` | Debug mode (`False` in production) |
| `DJANGO_ALLOWED_HOSTS`| `localhost,127.0.0.1` | Whitelisted host headers |
| `DJANGO_TIME_ZONE` | `Asia/Kolkata` | Clinic standard timezone |
| `DB_ENGINE` | `mysql` | Database engine (`mysql` or `sqlite`) |
| `DB_NAME` | `healthcare_management_db`| Database name |
| `DB_USER` | `hms_app_user` | MySQL database user |
| `DB_PASSWORD` | `change-this-local-password`| MySQL password |
| `DB_HOST` | `127.0.0.1` | MySQL server host |
| `DB_PORT` | `3306` | MySQL server port |
| `CORS_ALLOWED_ORIGINS`| `http://localhost:5173` | Allowed frontend origins |
| `JWT_ACCESS_TOKEN_MINUTES`| `60` | JWT access token lifetime |
| `JWT_REFRESH_TOKEN_DAYS` | `7` | JWT refresh token lifetime |

### Step 4: Run Migrations & Seed Demo Data
```bash
python manage.py migrate
python manage.py seed_data
```

### Step 5: (Optional) Create Custom Administrator
```bash
python manage.py createsuperuser
```

### Step 6: Start Backend Server
```bash
python manage.py runserver
```
The backend API server will run at `http://127.0.0.1:8000/`.

---

## 8. Frontend Setup & Execution

Open a new terminal window and navigate to `frontend`:

```bash
cd frontend

# Copy environment template
# Windows CMD / PowerShell:
copy .env.example .env
# macOS / Linux:
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend application will run at `http://localhost:5173/`.

---

## 9. Application URLs

| Service | Local URL |
| :--- | :--- |
| **Frontend Web Portal** | [http://localhost:5173/](http://localhost:5173/) |
| **Backend REST API** | [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/) |
| **Interactive Swagger UI** | [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/) |
| **Redoc API Documentation**| [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/) |
| **OpenAPI 3.0 Schema** | [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/) |
| **Django Administration** | [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) |

---

## 10. Demo Accounts & Credentials

The seed data command generates verified demo accounts across all system roles:

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `AdminPass123!` | System oversight, staff & department management |
| **Doctor (Cardiology)** | `dr.smith` | `DoctorPass123!` | Cardiology consultations & e-prescriptions |
| **Doctor (Pediatrics)** | `dr.jones` | `DoctorPass123!` | Pediatric consultations |
| **Doctor (Medicine)** | `dr.patel` | `DoctorPass123!` | General medicine consultations |
| **Receptionist** | `receptionist1` | `ReceptionPass123!` | Patient check-in, bookings & queue management |
| **Pharmacist** | `pharmacist1` | `PharmacyPass123!` | FEFO dispensing, stock receipts & expiry tracking |
| **Patient** | `john.doe` | `PatientPass123!` | Patient portal, bookings & prescription history |
| **Patient** | `jane.roe` | `PatientPass123!` | Patient portal |

> **Pro Tip:** The login page (`/login`) includes interactive **One-Click Quick Login** buttons to immediately test any role without manual typing.

---

## 11. Automated Testing & Verification

### Running Backend Automated Tests
The backend test suite covers authentication boundaries, privilege escalation prevention, doctor availability slot calculations, double-booking race condition prevention, and FEFO inventory dispensing:
```bash
cd backend
python manage.py test
```
**Test Results:** `11 tests executed, 100% passed, 0 failures, 0 errors.`

### Verifying Frontend Production Build
```bash
cd frontend
npm run build
```
**Build Output:** Zero-error production build generated in `frontend/dist/`.

---

## 12. Postman Collection

Import the included Postman collection:
- File: `postman/Healthcare_Management_System.postman_collection.json`
- Variables configured: `base_url`, `access_token`, `refresh_token`, `doctor_id`, `patient_id`, `appointment_id`, `prescription_id`, `medicine_id`.
- Covers authentication, doctor slots, patient creation, atomic appointments, consultation notes, e-prescriptions, FEFO dispensing, and dashboard analytics.

---

## 13. Troubleshooting

- **MySQL Connection Refused (`2003: Can't connect to MySQL server`):**  
  Ensure local MySQL 8.x service is running (`systemctl status mysql` on Linux or `Get-Service MySQL*` in Windows). If MySQL is not installed locally, set `DB_ENGINE=sqlite` in `backend/.env` for local testing.
- **Access Denied for Database User (`1045: Access denied for user`):**  
  Verify `DB_USER` and `DB_PASSWORD` match the credentials granted in MySQL.
- **PowerShell Script Execution Policy Error on Windows:**  
  Run PowerShell as Administrator and execute `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, or use CMD (`venv\Scripts\activate.bat`).
- **CORS Errors in Browser Console:**  
  Verify that `CORS_ALLOWED_ORIGINS` in `backend/.env` includes `http://localhost:5173` and `http://127.0.0.1:5173`.
- **Port Conflicts (Port 8000 or 5173 in use):**  
  Run Django on an alternative port: `python manage.py runserver 8080`, and update `VITE_API_BASE_URL` in `frontend/.env`.

---

## 14. AWS EC2 Deployment Reference

For a step-by-step production walkthrough on deploying to Ubuntu Linux on AWS EC2, Gunicorn systemd daemon, Nginx reverse proxy, MySQL RDS, and Let's Encrypt SSL, refer to:
- [docs/deployment-aws-ec2.md](docs/deployment-aws-ec2.md)
