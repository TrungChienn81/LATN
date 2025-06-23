import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance for reviews
const reviewApi = axios.create({
  baseURL: `${API_BASE_URL}/reviews`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
reviewApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
reviewApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Review API methods
export const reviewService = {
  // Get reviews for a product
  getProductReviews: (productId, params = {}) => {
    return reviewApi.get(`/product/${productId}`, { params });
  },

  // Create a new review
  createReview: (reviewData) => {
    return reviewApi.post('/', reviewData);
  },

  // Update an existing review
  updateReview: (reviewId, reviewData) => {
    return reviewApi.put(`/${reviewId}`, reviewData);
  },

  // Delete a review
  deleteReview: (reviewId) => {
    return reviewApi.delete(`/${reviewId}`);
  },

  // Vote on a review (helpful/unhelpful)
  voteReview: (reviewId, isHelpful) => {
    return reviewApi.post(`/${reviewId}/vote`, { isHelpful });
  },

  // Get current user's reviews
  getUserReviews: (params = {}) => {
    return reviewApi.get('/user', { params });
  },

  // Get shop reviews (for shop owners)
  getShopReviews: (params = {}) => {
    return reviewApi.get('/shop', { params });
  },

  // Reply to a review (shop owner)
  replyToReview: (reviewId, content) => {
    return reviewApi.post(`/${reviewId}/reply`, { content });
  }
};

export default reviewService; 