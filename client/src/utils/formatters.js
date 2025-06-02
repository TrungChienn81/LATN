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

  // If price is already in millions (less than 1000), return as is
  if (priceInVND < 1000) {
    return priceInVND;
  }

  // Convert to millions
  return priceInVND / 1000000;
}; 