import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: async (phone) => {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
  },

  verifyOTP: async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
  },

  completeRegistration: async (data) => {
    const response = await api.post('/auth/complete-registration', data);
    return response.data;
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    }
  },
};

// Owner API
export const ownerAPI = {
  getVets: async (params) => {
    const response = await api.get('/owner/vets', { params });
    return response.data;
  },

  getVetDetails: async (vetId) => {
    const response = await api.get(`/owner/vets/${vetId}`);
    return response.data;
  },

  createBooking: async (data) => {
    const response = await api.post('/owner/bookings', data);
    return response.data;
  },

  getBookings: async () => {
    const response = await api.get('/owner/bookings');
    return response.data;
  },

  getPets: async () => {
    const response = await api.get('/owner/pets');
    return response.data;
  },

  addPet: async (data) => {
    const response = await api.post('/owner/pets', data);
    return response.data;
  },

  getPetDetails: async (petId) => {
    const response = await api.get(`/owner/pets/${petId}`);
    return response.data;
  },

  getMarketplaceProducts: async (params) => {
    const response = await api.get('/owner/marketplace', { params });
    return response.data;
  },

  chatWithAI: async (message) => {
    const response = await api.post('/owner/ai-chat', { message });
    return response.data;
  },
};

// Vet API
export const vetAPI = {
  getDashboard: async () => {
    const response = await api.get('/vet/dashboard');
    return response.data;
  },

  getBookings: async () => {
    const response = await api.get('/vet/bookings');
    return response.data;
  },

  acceptBooking: async (bookingId) => {
    const response = await api.post(`/vet/bookings/${bookingId}/accept`);
    return response.data;
  },

  rejectBooking: async (bookingId) => {
    const response = await api.post(`/vet/bookings/${bookingId}/reject`);
    return response.data;
  },

  completeBooking: async (bookingId, data) => {
    const response = await api.post(`/vet/bookings/${bookingId}/complete`, data);
    return response.data;
  },

  getPatients: async () => {
    const response = await api.get('/vet/patients');
    return response.data;
  },

  getPatientDetails: async (patientId) => {
    const response = await api.get(`/vet/patients/${patientId}`);
    return response.data;
  },

  createPrescription: async (data) => {
    const response = await api.post('/vet/prescriptions', data);
    return response.data;
  },

  getEarnings: async (period) => {
    const response = await api.get('/vet/earnings', { params: { period } });
    return response.data;
  },

  updateAvailability: async (isAvailable) => {
    const response = await api.put('/vet/availability', { isAvailable });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/vet/profile', data);
    return response.data;
  },
};

// Clinic API
export const clinicAPI = {
  getDashboard: async () => {
    const response = await api.get('/clinic/dashboard');
    return response.data;
  },

  getTeam: async () => {
    const response = await api.get('/clinic/team');
    return response.data;
  },

  addTeamMember: async (data) => {
    const response = await api.post('/clinic/team', data);
    return response.data;
  },

  getTeamMemberDetails: async (memberId) => {
    const response = await api.get(`/clinic/team/${memberId}`);
    return response.data;
  },

  updateTeamMember: async (memberId, data) => {
    const response = await api.put(`/clinic/team/${memberId}`, data);
    return response.data;
  },

  getAnalytics: async (period) => {
    const response = await api.get('/clinic/analytics', { params: { period } });
    return response.data;
  },

  getBookings: async () => {
    const response = await api.get('/clinic/bookings');
    return response.data;
  },

  updateClinicProfile: async (data) => {
    const response = await api.put('/clinic/profile', data);
    return response.data;
  },
};

export default api;
