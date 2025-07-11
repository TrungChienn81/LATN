/**
 * Format price from millions to VND with proper formatting
 * @param {number} priceInMillions - Price in millions of VND
 * @returns {string} Formatted price string with VND symbol
 */
export const formatPriceToVND = (priceInMillions) => {
  if (priceInMillions == null || isNaN(priceInMillions)) {
    return 'Liên hệ';
  }
  
  // Convert to VND (multiply by 1,000,000)
  const priceInVND = priceInMillions * 1000000;
  
  // Format with thousand separators using 'decimal' style
  const formattedNumber = new Intl.NumberFormat('vi-VN', {
    style: 'decimal', // Change to 'decimal' to avoid currency symbol
    maximumFractionDigits: 0
  }).format(priceInVND);
  
  // Append ' đ' manually
  return `${formattedNumber} đ`;
};

/**
 * Format price directly from VND value (no conversion needed)
 * @param {number|string} priceInVND - Price in VND
 * @returns {string} Formatted price string with VND symbol
 */
export const formatVNDDirectly = (priceInVND) => {
  if (priceInVND == null || isNaN(priceInVND)) {
    return 'Liên hệ';
  }
  
  const price = parseFloat(priceInVND);
  
  // Format with thousand separators using 'decimal' style
  const formattedNumber = new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(price);
  
  // Append ' đ' manually
  return `${formattedNumber} đ`;
};

/**
 * Convert price from VND to millions
 * @param {number|string} priceInVND - Price in VND
 * @returns {number} Price in millions
 */
export const convertVNDToMillions = (priceInVND) => {
  if (typeof priceInVND === 'string') {
    // Remove all non-numeric characters
    priceInVND = parseFloat(priceInVND.replace(/[^0-9.-]+/g, ''));
  }
  
  if (isNaN(priceInVND)) {
    return 0;
  }

  // Always convert to millions by dividing by 1,000,000
  return priceInVND / 1000000;
}; 