// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', // Thêm fallback URL
  // Không đặt Content-Type mặc định để axios tự động xác định header phù hợp
  // Khi gửi FormData, axios sẽ tự động đặt 'Content-Type': 'multipart/form-data'
  // Khi gửi JSON, axios sẽ tự động đặt 'Content-Type': 'application/json'
});

// Thêm interceptor để tự động gắn token vào header
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;