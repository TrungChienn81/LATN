import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3001/api', // Sửa lại nếu backend port khác
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance; 