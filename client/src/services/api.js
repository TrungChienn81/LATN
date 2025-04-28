// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Lấy URL từ biến môi trường
  headers: {
    'Content-Type': 'application/json',
  },
});

// TODO: Thêm interceptor để tự động gắn token vào header sau này
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token'); // Hoặc lấy từ nơi khác
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default api;