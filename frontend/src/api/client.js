import axios from 'axios';

const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://smartwaste-ruir.onrender.com/api');
const baseURL = rawBase.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartwaste_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired and not on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('smartwaste_token');
        localStorage.removeItem('smartwaste_user');
      }
    }
    const message =
      error.response?.data?.message ||
      (error.response?.data?.errors ? error.response.data.errors.map(e => e.message).join(', ') : null) ||
      error.message ||
      'Network communication error. Please check your connection.';
    return Promise.reject(new Error(message));
  }
);

export default api;
