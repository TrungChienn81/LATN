import React, { createContext, useContext, useState, useEffect } from 'react';

// Tạo context
const CompareContext = createContext();

// Custom hook để sử dụng context
export const useCompare = () => useContext(CompareContext);

// Provider component
export const CompareProvider = ({ children }) => {
  // State để lưu trữ danh sách sản phẩm so sánh
  const [compareItems, setCompareItems] = useState([]);

  // Load danh sách sản phẩm so sánh từ localStorage khi component mount
  useEffect(() => {
    const storedItems = localStorage.getItem('compareItems');
    if (storedItems) {
      try {
        setCompareItems(JSON.parse(storedItems));
      } catch (error) {
        console.error('Error parsing compareItems from localStorage:', error);
        localStorage.removeItem('compareItems');
      }
    }
  }, []);

  // Lưu danh sách sản phẩm so sánh vào localStorage khi state thay đổi
  useEffect(() => {
    localStorage.setItem('compareItems', JSON.stringify(compareItems));
  }, [compareItems]);

  // Thêm sản phẩm vào danh sách so sánh
  const addToCompare = (product) => {
    // Kiểm tra nếu sản phẩm đã tồn tại trong danh sách
    if (compareItems.some(item => item._id === product._id)) {
      return;
    }
    
    // Giới hạn số lượng sản phẩm so sánh (tối đa 4)
    if (compareItems.length >= 4) {
      // Xóa sản phẩm đầu tiên nếu danh sách đã đầy
      setCompareItems(prev => [...prev.slice(1), product]);
    } else {
      setCompareItems(prev => [...prev, product]);
    }
  };

  // Xóa sản phẩm khỏi danh sách so sánh
  const removeFromCompare = (productId) => {
    setCompareItems(prev => prev.filter(item => item._id !== productId));
  };

  // Xóa tất cả sản phẩm khỏi danh sách so sánh
  const clearCompare = () => {
    setCompareItems([]);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export default CompareProvider;
