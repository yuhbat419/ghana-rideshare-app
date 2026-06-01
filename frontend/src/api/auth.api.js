import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
  verifyPhone: (data) => apiClient.post('/auth/verify-phone', data),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
};