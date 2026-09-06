import axios from 'axios';

// Dynamically determine the API Base URL for local and cloud deployments
const getApiBaseUrl = () => {
  // 1. Environment variable configured at build/runtime
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    let envUrl = import.meta.env.VITE_API_BASE_URL.trim();
    if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // 2. Global window injection if set
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  // 3. Browser environment: When deployed on cloud or behind reverse proxy
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port, origin } = window.location;
    // When deployed on public cloud domains (e.g. onrender.com, vercel.app, etc.)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${origin}/api`;
    }
    // In local dev server with proxy on port 5173
    if (port === '5173') {
      return '/api';
    }
  }

  // 4. Default fallback for local standalone execution
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_interview_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  demoLogin: () => api.post('/auth/demo-login'),
  getMe: () => api.get('/auth/me'),
};

export const interviewAPI = {
  create: (data) => api.post('/interview/create', data),
  getCurrent: (sessionId) => api.get(`/interview/${sessionId}/current`),
  submitAnswer: (data) => api.post('/interview/submit-answer', data),
  getReport: (sessionId) => api.get(`/interview/${sessionId}/report`),
  downloadPDFUrl: (sessionId) => `${API_BASE_URL}/interview/${sessionId}/pdf`,
};

export const historyAPI = {
  getAll: () => api.get('/history'),
  getAnalytics: () => api.get('/history/analytics'),
  deleteSession: (sessionId) => api.delete(`/history/${sessionId}`),
};

export const uploadAPI = {
  uploadResume: (formData) => api.post('/upload/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  analyzeJD: (data) => api.post('/upload/analyze-jd', data),
};

export default api;
