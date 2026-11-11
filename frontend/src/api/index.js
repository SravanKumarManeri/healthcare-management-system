import apiClient from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/token/', credentials),
  refreshToken: (refresh) => apiClient.post('/auth/token/refresh/', { refresh }),
  register: (patientData) => apiClient.post('/auth/register/', patientData),
  getMe: () => apiClient.get('/auth/me/'),
  updateProfile: (profileData) => apiClient.patch('/auth/me/', profileData),
  changePassword: (data) => apiClient.post('/auth/change-password/', data),
  listUsers: (params) => apiClient.get('/auth/users/', { params }),
  createStaffUser: (userData) => apiClient.post('/auth/users/', userData),
  updateUser: (id, data) => apiClient.patch(`/auth/users/${id}/`, data),
};

export const departmentsApi = {
  list: (params) => apiClient.get('/departments/', { params }),
  create: (data) => apiClient.post('/departments/', data),
  get: (id) => apiClient.get(`/departments/${id}/`),
  update: (id, data) => apiClient.patch(`/departments/${id}/`, data),
  delete: (id) => apiClient.delete(`/departments/${id}/`),
};

export const doctorsApi = {
  list: (params) => apiClient.get('/doctors/', { params }),
  get: (id) => apiClient.get(`/doctors/${id}/`),
  create: (data) => apiClient.post('/doctors/', data),
  update: (id, data) => apiClient.patch(`/doctors/${id}/`, data),
  getSlots: (id, date) => apiClient.get(`/doctors/${id}/availability/`, { params: { date } }),
  getWorkingHours: (id) => apiClient.get(`/doctors/${id}/working-hours/`),
  createWorkingHours: (id, data) => apiClient.post(`/doctors/${id}/working-hours/`, data),
  getExceptions: (id) => apiClient.get(`/doctors/${id}/exceptions/`),
  createException: (id, data) => apiClient.post(`/doctors/${id}/exceptions/`, data),
};

export const patientsApi = {
  list: (params) => apiClient.get('/patients/', { params }),
  create: (data) => apiClient.post('/patients/', data),
  get: (id) => apiClient.get(`/patients/${id}/`),
  update: (id, data) => apiClient.patch(`/patients/${id}/`, data),
};

export const appointmentsApi = {
  list: (params) => apiClient.get('/appointments/', { params }),
  book: (data) => apiClient.post('/appointments/', data),
  get: (id) => apiClient.get(`/appointments/${id}/`),
  reschedule: (id, data) => apiClient.patch(`/appointments/${id}/reschedule/`, data),
  cancel: (id, reason) => apiClient.post(`/appointments/${id}/cancel/`, { reason }),
  checkIn: (id) => apiClient.post(`/appointments/${id}/check-in/`),
  complete: (id) => apiClient.post(`/appointments/${id}/complete/`),
};

export const consultationsApi = {
  list: (params) => apiClient.get('/consultations/', { params }),
  create: (data) => apiClient.post('/consultations/', data),
  get: (id) => apiClient.get(`/consultations/${id}/`),
  update: (id, data) => apiClient.patch(`/consultations/${id}/`, data),
};

export const pharmacyApi = {
  listMedicines: (params) => apiClient.get('/medicines/', { params }),
  createMedicine: (data) => apiClient.post('/medicines/', data),
  getMedicine: (id) => apiClient.get(`/medicines/${id}/`),
  updateMedicine: (id, data) => apiClient.patch(`/medicines/${id}/`, data),
  getLowStockAlerts: () => apiClient.get('/pharmacy/low-stock/'),
  receiveStock: (data) => apiClient.post('/pharmacy/stock/receive/', data),
  adjustStock: (data) => apiClient.post('/pharmacy/stock/adjust/', data),
  listPrescriptions: (params) => apiClient.get('/prescriptions/', { params }),
  getPrescription: (id) => apiClient.get(`/prescriptions/${id}/`),
  createPrescription: (data) => apiClient.post('/prescriptions/', data),
  dispensePrescription: (id) => apiClient.post(`/pharmacy/prescriptions/${id}/dispense/`),
  getMovements: (params) => apiClient.get('/pharmacy/movements/', { params }),
};

export const dashboardsApi = {
  getAdmin: () => apiClient.get('/dashboards/admin/'),
  getDoctor: () => apiClient.get('/dashboards/doctor/'),
  getReception: () => apiClient.get('/dashboards/reception/'),
  getPharmacy: () => apiClient.get('/dashboards/pharmacy/'),
  getPatient: () => apiClient.get('/dashboards/patient/'),
};
