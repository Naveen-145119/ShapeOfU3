// test/frontend/shape-of-you-frontend/src/lib/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  forgotPassword: (emailData) => api.post('/auth/forgot-password', emailData),
  resetPassword: (token, passwordData) => api.put(`/auth/reset-password/${token}`, passwordData),
};

// Events API calls
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
  getCategories: () => api.get('/events/categories'),
};

// Bookings API calls
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getMyBookings: () => api.get('/bookings/my-bookings'), 
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  checkIn: (id) => api.put(`/bookings/${id}/checkin`),
   // ⭐ ADD THIS NEW METHOD FOR PAYU INITIATION
   initiatePayment: (data) => api.post('/bookings/initiate-payment', data), 
  mockPaymentSuccess: (bookingData) => api.post('/mock-payment/success', bookingData),
};

// Coupons API calls
export const couponsAPI = {
  validateCoupon: (couponData) => api.post('/coupons/validate', couponData),
};

// Admin API calls
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
  // ⭐ ADDED: Analytics API methods
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }), 
  getCouponAnalytics: (params) => api.get('/admin/analytics/coupons', { params }), 
};

export default api;