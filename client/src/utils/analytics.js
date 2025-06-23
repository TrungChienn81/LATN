import api from '../services/api';

/**
 * Ghi lại hành vi người dùng để huấn luyện mô hình AI
 * @param {string} action - Loại hành vi: 'view', 'click', 'add_to_cart', 'purchase', 'search'
 * @param {string} productId - ID của sản phẩm liên quan
 * @param {Object} metadata - Thông tin bổ sung về hành vi
 * @returns {Promise} - Promise từ API call
 */
export const logUserBehavior = async (action, productId, metadata = {}) => {
  try {
    // Thêm timestamp 
    const data = {
      action,
      productId,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    // Gọi API để lưu hành vi người dùng
    return await api.post('/user-behaviors', data);
  } catch (error) {
    console.error('Error logging user behavior:', error);
    // Không hiển thị lỗi cho người dùng vì đây là logging
    return null;
  }
};

/**
 * Lấy recommendation từ model AI
 * @param {string} userId - ID của người dùng
 * @param {number} limit - Số lượng recommendation muốn lấy 
 * @returns {Promise} - Promise chứa danh sách sản phẩm được đề xuất
 */
export const getPersonalizedRecommendations = async (limit = 8) => {
  try {
    const response = await api.get(`/ai/recommendations?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    // Return fallback data instead of throwing error
    return {
      success: false,
      data: {
        recommendations: [],
        based_on: 'fallback'
      }
    };
  }
};

/**
 * Lấy sản phẩm tương tự dựa trên sản phẩm hiện tại
 * @param {string} productId - ID của sản phẩm muốn tìm sản phẩm tương tự
 * @param {number} limit - Số lượng sản phẩm tương tự muốn lấy
 * @returns {Promise} - Promise chứa danh sách sản phẩm tương tự
 */
export const getSimilarProducts = async (productId, limit = 4) => {
  try {
    const response = await api.get(`/ai/similar-products/${productId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching similar products:', error);
    throw error;
  }
};

/**
 * Lấy trending products dựa trên dữ liệu người dùng
 * @param {number} limit - Số lượng sản phẩm trending muốn lấy 
 * @returns {Promise} - Promise chứa danh sách sản phẩm trending
 */
export const getTrendingProducts = async (limit = 8) => {
  try {
    const response = await api.get(`/ai/trending-products?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trending products:', error);
    // Return fallback data
    return {
      success: false,
      data: {
        trending_products: [],
        timeframe_days: 7
      }
    };
  }
};
