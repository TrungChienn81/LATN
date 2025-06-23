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

// Response interceptor to handle auth errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Don't redirect for RAG test page
      if (!window.location.pathname.includes('/rag-test')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 