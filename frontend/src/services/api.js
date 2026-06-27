import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePassword: (data) => api.put('/users/password', data),
  updateXpAndLevel: (data) => api.put('/users/xp-level', data),
};

export const diagnosticAPI = {
  create: (data) => api.post('/diagnostics', data),
  getAll: () => api.get('/diagnostics'),
  getLatest: () => api.get('/diagnostics/latest'),
  updateProgress: (data) => api.put('/diagnostics/progress', data),
  markQuestionAsMastered: (data) => api.post('/diagnostics/mark-mastered', data),
};

export const simulationAPI = {
  create: (data) => api.post('/simulations', data),
  getAll: () => api.get('/simulations'),
  getLatest: () => api.get('/simulations/latest'),
  markScenarioAsMastered: (data) => api.post('/simulations/mark-mastered', data),
};

export const achievementAPI = {
  initialize: () => api.post('/achievements/initialize'),
  getAll: () => api.get('/achievements'),
  unlock: (data) => api.post('/achievements/unlock', data),
  getUserAchievements: () => api.get('/achievements/user'),
  resetUserAchievements: () => api.delete('/achievements/user'),
};

export const activityAPI = {
  create: (data) => api.post('/activities', data),
  getUserActivities: () => api.get('/activities'),
};

export const certificateAPI = {
  create: (data) => api.post('/certificates', data),
  getUserCertificates: () => api.get('/certificates/user'),
  getCertificateById: (id) => api.get(`/certificates/${id}`),
};

export default api;
