import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Pagination,
  Avatar,
  Checkbox,
  Toolbar,
  Tooltip,
  CardContent,
  Card
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ProductList from './ProductList';
import ProductFormDialog from './ProductFormDialog';
import api from '../../../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { formatPriceToVND, convertVNDToMillions } from '../../../utils/formatters';
import ConfirmDialog from '../../common/ConfirmDialog';

const AdminProductManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State cho phân trang
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // State cho chọn nhiều sản phẩm
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for import mapping dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    name: '', // Tên sản phẩm
    description: '', // Mô tả
    price: '', // Giá
    stockQuantity: '', // Số lượng tồn kho (không bắt buộc)
    category: '', // Danh mục (không bắt buộc)
    brand: '', // Thương hiệu (không bắt buộc)
    image: '', // URL ảnh
    // Các trường proloop
    'proloop-technical--line': '',
    'proloop-technical--line 2': '',
    'proloop-technical--line 3': '',
    'proloop-technical--line 4': '',
    'proloop-technical--line 5': '',
    'proloop-technical--line 6': '',
    'proloop-price--compare': '',
    'img_default_src': '',
  });
  const [sampleData, setSampleData] = useState([]);

  // State for results dialog
  const [importResults, setImportResults] = useState(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  // State cho dialog xác nhận xóa
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  
  // State cho dialog xác nhận xóa tất cả sản phẩm
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Thêm ref để theo dõi việc fetch
  const isFetchingRef = useRef(false);

  // Hàm fetch sản phẩm với phân trang
  const fetchProducts = async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const { page, limit } = pagination;
      console.log(`Fetching products: page=${page}, limit=${limit}`);
      const response = await api.get(`/products?page=${page}&limit=${limit}`);
      if (response.data && response.data.success) {
        // Cập nhật thông tin phân trang
        const newPagination = {
          ...pagination,
          total: response.data.total,
          totalPages: response.data.totalPages,
          page: response.data.currentPage
        };
        console.log('Updating pagination with server response:', newPagination);
        setPagination(newPagination);
        
        // Map các danh mục và thương hiệu từ ID sang tên để hiển thị
        const productsWithNames = response.data.data.map(product => {
          try {
            // Xử lý category name
            let categoryName = 'Không xác định';
            
            if (product.category) {
              if (typeof product.category === 'object' && product.category.name) {
                // Category đã được populate từ server
                categoryName = product.category.name;
              } else if (typeof product.category === 'string') {
                // Category là ID string hoặc tên, cần tìm tên
                const category = categories.find(cat => cat._id === product.category);
                if (category && category.name) {
                  // Tìm thấy category theo ID
                  categoryName = category.name;
                } else {
                  // Không tìm thấy theo ID, có thể category đã là tên
                  // Kiểm tra xem có category nào có tên giống không
                  const categoryByName = categories.find(cat => 
                    cat.name && cat.name.toLowerCase() === product.category.toLowerCase()
                  );
                  if (categoryByName) {
                    categoryName = categoryByName.name;
                  } else {
                    // Không tìm thấy trong danh sách, sử dụng giá trị gốc làm tên
                    categoryName = product.category;
                    console.log(`Category "${product.category}" not found in categories list, using as display name`);
                  }
                }
              }
            }
            
            // Xử lý brand name - Improved logic
            let brandName = 'Không xác định';
            
            if (product.brand) {
              if (typeof product.brand === 'object' && product.brand.name) {
                // Brand đã được populate từ server
                brandName = product.brand.name;
              } else if (typeof product.brand === 'string') {
                // Brand là ID string hoặc tên, cần tìm tên
                const brand = brands.find(b => b._id === product.brand);
                if (brand && brand.name) {
                  // Tìm thấy brand theo ID
                  brandName = brand.name;
                } else {
                  // Không tìm thấy theo ID, có thể brand đã là tên
                  // Kiểm tra xem có brand nào có tên giống không
                  const brandByName = brands.find(b => 
                    b.name && b.name.toLowerCase() === product.brand.toLowerCase()
                  );
                  if (brandByName) {
                    brandName = brandByName.name;
                  } else {
                    // Không tìm thấy trong danh sách, sử dụng giá trị gốc làm tên
                    brandName = product.brand;
                    console.log(`Brand "${product.brand}" not found in brands list, using as display name`);
                  }
                }
              }
            }
            
            // If still "Không xác định", try to extract from product name
            if (brandName === 'Không xác định' && product.name) {
              const nameParts = product.name.split(' ');
              
              // Look for known brands in the product name
              for (const part of nameParts) {
                const partLower = part.toLowerCase();
                if (['msi', 'acer', 'asus', 'dell', 'hp', 'lenovo', 'apple', 'samsung', 'lg', 'sony', 
                     'intel', 'amd', 'nvidia', 'corsair', 'kingston', 'crucial', 'western', 'seagate',
                     'logitech', 'razer', 'steelseries', 'hyperx', 'cooler', 'master', 'thermaltake',
                     'gigabyte', 'asrock', 'evga', 'zotac'].includes(partLower)) {
                  brandName = part.toUpperCase();
                  break;
                }
              }
              
              // Fallback to position-based extraction
              if (brandName === 'Không xác định' && nameParts.length >= 3) {
                const possibleBrand = nameParts[2];
                if (possibleBrand && 
                    !['gaming', 'laptop', 'pc', 'màn', 'hình', 'chuột', 'bàn', 'phím'].includes(possibleBrand.toLowerCase()) &&
                    possibleBrand.length >= 2) {
                  brandName = possibleBrand;
                }
              }
            }
            
            return {
              ...product,
              categoryName: categoryName,
              brandName: brandName,
              // Ensure shop data is available for display
              shop: product.shop || product.shopId
            };
          } catch (mappingError) {
            console.error('Lỗi khi xử lý sản phẩm:', mappingError, 'Product:', product);
            return {
              ...product,
              categoryName: product.category?.name || (typeof product.category === 'string' ? product.category : 'Không xác định'),
              brandName: product.brand?.name || (typeof product.brand === 'string' ? product.brand : 'Không xác định'),
              shop: product.shop || product.shopId
            };
          }
        });
        
        setProducts(productsWithNames);
        console.log('Categories available for mapping:', categories);
        console.log('Brands available for mapping:', brands);
        console.log('Fetched products with category/brand names:', productsWithNames);
        console.log('Sample product for debugging:', productsWithNames[0]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({
        open: true,
        message: 'Không thể tải danh sách sản phẩm.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Fetch categories, brands khi component mount hoặc refreshKey thay đổi
  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      try {
        console.log('Fetching categories and brands...');
        
        // Fetch categories
        const categoriesResponse = await api.get('/categories');
        if (categoriesResponse.data && categoriesResponse.data.success) {
          const fetchedCategories = categoriesResponse.data.data || [];
          setCategories(fetchedCategories);
          console.log('Categories loaded:', fetchedCategories);
        }
        
        // Fetch brands
        const brandsResponse = await api.get('/brands');
        if (brandsResponse.data && brandsResponse.data.success) {
          const fetchedBrands = brandsResponse.data.data || [];
          setBrands(fetchedBrands);
          console.log('Brands loaded:', fetchedBrands);
        }
        
        // Reset selections when refreshing
        setSelectedProducts([]);
        setSelectAll(false);
      } catch (error) {
        console.error('Error fetching categories and brands:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải danh mục và thương hiệu. Một số tính năng có thể bị hạn chế.',
          severity: 'warning'
        });
      }
    };
    
    fetchCategoriesAndBrands();
  }, [refreshKey]);

  // Fetch products khi có categories và brands, hoặc khi trang thay đổi
  useEffect(() => {
    // Chỉ fetch products khi component đã sẵn sàng và có đầy đủ categories/brands
    if (categories.length > 0 && brands.length > 0) {
      console.log(`Fetching products for page ${pagination.page}, limit ${pagination.limit}`);
      fetchProducts();
      // Reset selections when changing page
      setSelectedProducts([]);
      setSelectAll(false);
    }
  }, [pagination.page, pagination.limit, categories.length, brands.length]);

  // Thêm useEffect để re-fetch products khi refreshKey thay đổi
  useEffect(() => {
    // Re-fetch products khi refreshKey thay đổi
    if (refreshKey > 0 && categories.length > 0 && brands.length > 0) {
      console.log(`Refreshing products due to refreshKey change: ${refreshKey}, keeping current page: ${pagination.page}`);
      fetchProducts();
    }
  }, [refreshKey]);

  // Debug useEffect for editingProduct
  useEffect(() => {
    console.log('editingProduct changed:', editingProduct);
    console.log('Form open status:', isFormOpen);
  }, [editingProduct, isFormOpen]);

  // Hàm xử lý thay đổi trang
  const handlePageChange = (event, value) => {
    console.log(`Page change requested: ${value}`);
    setPagination(prev => {
      console.log(`Updating pagination from page ${prev.page} to page ${value}`);
      return {
        ...prev,
        page: value
      };
    });
  };

  // Hàm xử lý thay đổi số sản phẩm trên mỗi trang
  const handleLimitChange = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: event.target.value,
      page: 1 // Reset về trang 1 khi thay đổi limit
    }));
  };

  // Hàm xử lý chọn/bỏ chọn sản phẩm
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Hàm xử lý chọn tất cả sản phẩm trên trang hiện tại
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
      setSelectAll(false);
    } else {
      const currentPageProductIds = products.map(product => product._id);
      setSelectedProducts(currentPageProductIds);
      setSelectAll(true);
    }
  };

  // Update selectAll state when selectedProducts changes
  useEffect(() => {
    const currentPageProductIds = products.map(product => product._id);
    const allCurrentPageSelected = currentPageProductIds.length > 0 && 
      currentPageProductIds.every(id => selectedProducts.includes(id));
    setSelectAll(allCurrentPageSelected);
  }, [selectedProducts, products]);

  // Hàm xóa nhiều sản phẩm được chọn
  const handleBulkDelete = async () => {
    try {
      setIsSubmitting(true);
      const deletePromises = selectedProducts.map(productId => 
        api.delete(`/products/${productId}`)
      );
      
      await Promise.all(deletePromises);
      
      setSnackbar({
        open: true,
        message: `Đã xóa thành công ${selectedProducts.length} sản phẩm.`,
        severity: 'success'
      });
      
      setSelectedProducts([]);
      setSelectAll(false);
      setBulkDeleteConfirmOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi xóa sản phẩm.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility function to find category by name
  const findCategoryByName = (categoryName) => {
    if (!categoryName || !categories.length) return null;
    
    // Tìm theo tên chính xác trước
    const exactMatch = categories.find(cat => 
      cat.name && cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (exactMatch) return exactMatch._id;
    
    // Tìm theo tên gần đúng (contains)
    const partialMatch = categories.find(cat => 
      cat.name && cat.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    if (partialMatch) return partialMatch._id;
    
    // Nếu không tìm thấy trong database categories, thử tìm trong localStorage categories
    try {
      const savedCategories = localStorage.getItem('admin_categories');
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        const localCategory = parsedCategories.find(cat => 
          cat.name && cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (localCategory) {
          // Nếu tìm thấy trong localStorage, tìm category tương ứng trong database
          const dbCategory = categories.find(cat => 
            cat.name && cat.name.toLowerCase() === localCategory.name.toLowerCase()
          );
          return dbCategory ? dbCategory._id : null;
        }
      }
    } catch (error) {
      console.warn('Error reading localStorage categories:', error);
    }
    
    return null;
  };

  // Utility function to find brand by name  
  const findBrandByName = (brandName) => {
    if (!brandName || !brands.length) return null;
    
    // Tìm theo tên chính xác trước
    const exactMatch = brands.find(brand => 
      brand.name && brand.name.toLowerCase() === brandName.toLowerCase()
    );
    if (exactMatch) return exactMatch._id;
    
    // Tìm theo tên gần đúng (contains)
    const partialMatch = brands.find(brand => 
      brand.name && brand.name.toLowerCase().includes(brandName.toLowerCase())
    );
    if (partialMatch) return partialMatch._id;
    
    return null;
  };

  const handleEdit = (product) => {
    console.log('handleEdit called with product:', product);
    console.log('Product ID:', product?._id);
    console.log('Product name:', product?.name);
    
    // Sử dụng callback để đảm bảo state được update đúng cách
    setEditingProduct(prevProduct => {
      console.log('Setting editingProduct from:', prevProduct, 'to:', product);
      return product;
    });
    
    setIsFormOpen(prevOpen => {
      console.log('Setting isFormOpen from:', prevOpen, 'to: true');
      return true;
    });
  };

  const handleDelete = async (productId) => {
    setDeletingProductId(productId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/products/${deletingProductId}`);
      
      setSnackbar({
        open: true,
        message: 'Sản phẩm đã được xóa thành công.',
        severity: 'success'
      });
      
      setDeleteConfirmOpen(false);
      setDeletingProductId(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi xóa sản phẩm.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllProducts = async () => {
    try {
      setIsSubmitting(true);
      await api.delete('/products/delete-all');
      
      setSnackbar({
        open: true,
        message: 'Tất cả sản phẩm đã được xóa thành công.',
        severity: 'success'
      });
      
      setDeleteAllConfirmOpen(false);
      setSelectedProducts([]);
      setSelectAll(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting all products:', error);
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi xóa tất cả sản phẩm.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseFormDialog = () => {
    console.log('handleCloseFormDialog called, isSubmitting:', isSubmitting);
    if (isSubmitting) return;
    console.log('Closing form dialog and resetting editingProduct');
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = async (formData, images) => {
    try {
      setIsSubmitting(true);
      
      console.log('=== PRODUCT SUBMIT DEBUG ===');
      console.log('Edit mode:', !!editingProduct);
      console.log('Form data received:', formData);
      console.log('Images received:', images);
      console.log('Editing product:', editingProduct);
      
      // Tách images và existingImages từ formData
      const { images: _, existingImages, ...otherFormData } = formData;
      
      // Tìm category ID từ tên category
      if (otherFormData.category) {
        const categoryId = findCategoryByName(otherFormData.category);
        if (categoryId) {
          otherFormData.category = categoryId;
        } else {
          // Nếu không tìm thấy category trong database, giữ nguyên tên để server xử lý
          console.log(`Category "${otherFormData.category}" not found in database, keeping name for server to handle`);
        }
      }
      
      // Tìm brand ID từ tên brand
      if (otherFormData.brand) {
        const brandId = findBrandByName(otherFormData.brand);
        if (brandId) {
          otherFormData.brand = brandId;
        } else {
          // Nếu không tìm thấy brand trong database, giữ nguyên tên để server xử lý
          console.log(`Brand "${otherFormData.brand}" not found in database, keeping name for server to handle`);
        }
      }

      let response;
      
      if (images && images.length > 0) {
        // Sử dụng FormData nếu có file ảnh mới
        const formDataToSend = new FormData();
        
        Object.keys(otherFormData).forEach(key => {
          formDataToSend.append(key, otherFormData[key]);
        });
        
        // Thêm ảnh mới
        images.forEach(image => {
          formDataToSend.append('images', image);
        });
        
        // Thêm ảnh cũ nếu có
        if (existingImages && existingImages.length > 0) {
          existingImages.forEach(imageUrl => {
            formDataToSend.append('existingImages', imageUrl);
          });
        }
        
        console.log('Sending FormData with new images');
        
        if (editingProduct && editingProduct._id) {
          console.log(`Updating product ${editingProduct._id} with FormData`);
          response = await api.put(
            `/products/${editingProduct._id}`,
            formDataToSend,
            {
              headers: { 'Content-Type': 'multipart/form-data' }
            }
          );
        } else {
          console.log('Creating new product with FormData');
          response = await api.post('/products', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        // Sử dụng JSON nếu không có file ảnh mới
        const finalData = { ...otherFormData };

        // Đảm bảo shopId là ID nếu nó là object
        if (finalData.shopId && typeof finalData.shopId === 'object' && finalData.shopId._id) {
          finalData.shopId = finalData.shopId._id;
        }

        console.log('Existing images before processing:', existingImages);
        
        // Bao gồm ảnh đã tồn tại (nếu có) - lọc các đối tượng không hợp lệ
        if (existingImages && existingImages.length > 0) {
          finalData.images = existingImages.filter(img => typeof img === 'string' && img.trim() !== '');
          console.log('Using existingImages for finalData.images:', finalData.images);
        } else if (editingProduct && editingProduct.images && Array.isArray(editingProduct.images)) {
          // Bảo toàn ảnh gốc của sản phẩm nếu không có ảnh mới được thêm
          finalData.images = editingProduct.images.filter(url => typeof url === 'string' && url.trim() !== '');
          console.log('Using original product images for finalData.images:', finalData.images);
        } else {
          // Nếu không có existingImages và cũng không có file mới, đảm bảo images là mảng rỗng
          finalData.images = []; 
          console.log('No images found, setting empty array');
        }
        
        console.log('Final JSON data to send:', finalData);
        
        if (editingProduct && editingProduct._id) {
          console.log(`Updating product ${editingProduct._id} with JSON data`);
          response = await api.put(
            `/products/${editingProduct._id}`, 
            finalData
          );
        } else {
          console.log('Creating new product with JSON data');
          response = await api.post('/products', finalData);
        }
      }
      
      console.log('Server response:', response.data);
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!',
          severity: 'success'
        });
        
        setIsFormOpen(false);
        setEditingProduct(null);
        
        // Force refresh ngay lập tức và sau đó delay một chút
        setRefreshKey(prev => prev + 1);
        
        // Thêm một refresh delay để đảm bảo server đã commit changes
        setTimeout(() => {
          setRefreshKey(prev => prev + 1);
          console.log('Force refreshing product list after edit...');
        }, 500);
        
        console.log('Product saved successfully, refreshing list...');
      } else {
        throw new Error(response.data.message || 'Không thể lưu sản phẩm');
      }
    } catch (error) {
      console.error('Lỗi khi lưu sản phẩm:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      setSnackbar({
        open: true,
        message: `Có lỗi xảy ra: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Hàm kiểm tra xem một chuỗi có phải URL ảnh không
   */
  const isImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    // Check if it's likely an image URL
    const isUrl = url.startsWith('http') || url.startsWith('https') || url.startsWith('/uploads/');
    const hasImageExtension = /\.(jpeg|jpg|png|gif|webp|svg|bmp)($|\?)/.test(url.toLowerCase());
    
    return isUrl && hasImageExtension;
  };

  // Xử lý khi người dùng chọn file để import
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    try {
      // Xử lý file CSV
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: function(results) {
            if (results.data && results.data.length > 0) {
              setFileData(results.data);
              const headers = results.meta.fields || [];
              setFileHeaders(headers);
              setSampleData(results.data.slice(0, 5));
              setupColumnMapping(headers); // Auto-map columns
              setIsImportDialogOpen(true);
            } else {
              setSnackbar({
                open: true,
                message: 'File CSV không có dữ liệu',
                severity: 'error'
              });
            }
          },
          error: function(error) {
            console.error('Error parsing CSV:', error);
            setSnackbar({
              open: true,
              message: 'Lỗi khi đọc file CSV',
              severity: 'error'
            });
          }
        });
      }
      // Xử lý file Excel
      else if (['xlsx', 'xls'].includes(fileExtension)) {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData && jsonData.length > 1) { // Kể cả tiêu đề
              const headers = jsonData[0];
              const rows = jsonData.slice(1);
              
              const formattedData = rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                  obj[header] = row[index];
                });
                return obj;
              });
              
              setFileData(formattedData);
              setFileHeaders(headers);
              setSampleData(formattedData.slice(0, 5));
              setupColumnMapping(headers); // Auto-map columns
              setIsImportDialogOpen(true);
            } else {
              setSnackbar({
                open: true,
                message: 'File Excel không có dữ liệu',
                severity: 'error'
              });
            }
          } catch (error) {
            console.error('Error processing Excel file:', error);
            setSnackbar({
              open: true,
              message: 'Lỗi khi xử lý file Excel',
              severity: 'error'
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setSnackbar({
          open: true,
          message: 'Chỉ hỗ trợ file CSV, XLSX hoặc XLS',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error handling file:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi xử lý file',
        severity: 'error'
      });
    }
    
    // Reset giá trị input file để có thể chọn lại cùng file nếu cần
    event.target.value = '';
  };
  
  // Khi đóng dialog import sản phẩm
  const handleImportDialogClose = () => {
    setIsImportDialogOpen(false);
    setFileData(null);
    setFileHeaders([]);
    setColumnMapping({
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      brand: '',
      image: '',
      // Các trường proloop
      'proloop-technical--line': '',
      'proloop-technical--line 2': '',
      'proloop-technical--line 3': '',
      'proloop-technical--line 4': '',
      'proloop-technical--line 5': '',
      'proloop-technical--line 6': '',
      'proloop-price--compare': '',
      'img_default_src': '',
    });
    setSampleData([]);
  };

  // Modified: Add auto-mapping of columns when opening the import dialog
  const setupColumnMapping = (headers) => {
    const initialMapping = {
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      brand: '',
      image: '',
      // Các trường proloop
      'proloop-technical--line': '',
      'proloop-technical--line 2': '',
      'proloop-technical--line 3': '',
      'proloop-technical--line 4': '',
      'proloop-technical--line 5': '',
      'proloop-technical--line 6': '',
      'proloop-price--compare': '',
      'img_default_src': '',
    };

    // Auto-detect columns by name
    headers.forEach(header => {
      const headerStr = String(header).toLowerCase();
      
      // Try to auto-map columns based on header names
      if (headerStr === 'proloop-name' || headerStr.includes('tên sản phẩm')) {
        initialMapping.name = header;
      }
      else if (headerStr === 'proloop-price--compare' || headerStr.includes('compare') || headerStr.includes('giá')) {
        initialMapping['proloop-price--compare'] = header;
      }
      else if (headerStr === 'img-default src' || headerStr.includes('image')) {
        initialMapping.image = header;
      }
      else if (headerStr.includes('technical--line')) {
        const lineMatch = headerStr.match(/technical--line\s*(\d*)/);
        const lineNum = lineMatch && lineMatch[1] ? lineMatch[1] : '';
        const fieldName = lineNum ? `proloop-technical--line ${lineNum}` : 'proloop-technical--line';
        initialMapping[fieldName] = header;
      }
    });

    console.log("Auto-mapped columns:", initialMapping);
    setColumnMapping(initialMapping);
  };
  
  // Xử lý khi đóng dialog kết quả import
  const handleResultsDialogClose = () => {
    setIsResultsDialogOpen(false);
    // Refresh danh sách sản phẩm sau khi import
    if (importResults && importResults.success > 0) {
      setRefreshKey(prev => prev + 1);
    }
  };
  
  // Hàm xử lý import với mapping đã chọn
  const handleImportWithMapping = async () => {
    // Kiểm tra xem ít nhất có trường tên sản phẩm được mapping chưa
    if (!columnMapping.name) {
      setSnackbar({
        open: true,
        message: 'Bạn cần chọn cột nào chứa tên sản phẩm',
        severity: 'error'
      });
      return;
    }
    
    try {
      // Chuyển đổi dữ liệu thô sang dữ liệu đã mapping
      const mappedData = fileData.map(row => {
        const mappedRow = {};
        // Tạo mô tả từ các trường proloop-technical-line
        let description = '';
        
        // Nếu có cột đầu tiên chứa URL ảnh (thường là chúng ta sẽ có cột img-default-src hoặc tương tự)
        if (fileHeaders.length > 0 && row[fileHeaders[0]]) {
          const firstColValue = row[fileHeaders[0]];
          if (isImageUrl(firstColValue)) {
            // Đây có thể là URL ảnh
            mappedRow.images = [firstColValue];
            console.log('Found image URL in first column:', firstColValue);
          }
        }
        
        // Lặp qua từng trường mapping và gán giá trị tương ứng
        Object.keys(columnMapping).forEach(field => {
          const column = columnMapping[field];
          if (column && row[column] !== undefined) {
            // Nếu là trường proloop-technical, thêm vào mô tả
            if (field.startsWith('proloop-technical--line')) {
              const value = row[column];
              if (value) {
                if (description) description += '\n';
                description += value;
              }
            } 
            // Nếu là trường giá
            else if (field === 'proloop-price--compare') {
              mappedRow.price = row[column];
              // Chuyển đổi giá từ định dạng "25.990.000đ" sang số
              if (typeof mappedRow.price === 'string') {
                mappedRow.price = mappedRow.price.replace(/[^\d]/g, ''); // Loại bỏ tất cả ký tự không phải số
                mappedRow.price = parseFloat(mappedRow.price) / 1000000; // Chuyển sang đơn vị triệu
              }
            } 
            // Nếu là trường ảnh
            else if (field === 'image' || field === 'img_default_src') {
              const imageUrl = row[column];
              // Kiểm tra xem có phải URL ảnh hợp lệ không
              if (isImageUrl(imageUrl)) {
                // Sử dụng mảng images thay vì trường image đơn lẻ
                mappedRow.images = [imageUrl];
                console.log('Found image URL from mapping:', imageUrl);
              }
            }
            // Các trường khác
            else {
              mappedRow[field] = row[column];
            }
          }
        });

        // Đảm bảo mỗi sản phẩm có mảng images
        if (!mappedRow.images || mappedRow.images.length === 0) {
          mappedRow.images = [];
        }

        // Gán mô tả từ các trường proloop-technical
        if (description) {
          mappedRow.description = description;
        }

        // Xác định stockQuantity mặc định
        if (!mappedRow.stockQuantity) {
          mappedRow.stockQuantity = 10; // Số lượng mặc định
        }
        
        // Nếu không có category, đặt mặc định là "Gaming"
        if (!mappedRow.category) {
          mappedRow.category = 'Gaming';
        }

        // Xử lý trường brand từ tên sản phẩm nếu chưa được set
        if (!mappedRow.brand && mappedRow.name) {
          const nameParts = mappedRow.name.split(' ');
          if (nameParts.length > 1) {
            // Thường tên sản phẩm có format: "Laptop gaming Acer..."
            // Lấy phần tử thứ 3 (index 2) là thương hiệu
            if (nameParts.length >= 3) {
              mappedRow.brand = nameParts[2]; // Acer, Dell, HP, etc.
            }
          }
        }
        
        // Đảm bảo ít nhất có tên sản phẩm
        if (!mappedRow.name) return null;
        
        return mappedRow;
      }).filter(Boolean); // Loại bỏ các dòng không có tên sản phẩm
      
      if (mappedData.length === 0) {
        setSnackbar({
          open: true,
          message: 'Không có dữ liệu hợp lệ sau khi mapping',
          severity: 'error'
        });
        return;
      }
      
      // Log dữ liệu đã mapping để kiểm tra
      console.log('Mapped data:', mappedData);
      
      // Hiển thị thông báo đang import
      setSnackbar({
        open: true,
        message: 'Đang import sản phẩm...',
        severity: 'info'
      });
      setIsImportDialogOpen(false);
      
      // Gửi dữ liệu tới server để import
      const response = await api.post('/products/import', { 
        products: mappedData,
        useProloopFields: true // Bật flag để server biết xử lý các trường proloop
      });
      
      console.log('Import response:', response.data);
      
      if (response.data && response.data.success) {
        // Hiển thị kết quả import
        setImportResults({
          success: response.data.success || 0,
          failed: response.data.failed || 0,
          errors: response.data.failures || []
        });
        setIsResultsDialogOpen(true);
        
        // Hiển thị thông báo thành công
        setSnackbar({
          open: true,
          message: `Đã import thành công ${response.data.success} sản phẩm`,
          severity: 'success'
        });
        
        // Refresh danh sách sản phẩm
        setRefreshKey(prev => prev + 1);
      } else {
        throw new Error(response.data.message || 'Import thất bại');
      }
    } catch (error) {
      console.error('Import error:', error);
      setSnackbar({
        open: true,
        message: `Lỗi khi import: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header với các nút thao tác */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Quản lý sản phẩm
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            sx={{ textTransform: 'none' }}
          >
            Thêm sản phẩm
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={() => {
              console.log('Manual refresh triggered');
              setRefreshKey(prev => prev + 1);
            }}
            sx={{ textTransform: 'none' }}
          >
            🔄 Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ textTransform: 'none' }}
          >
            Import từ file
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setDeleteAllConfirmOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Xóa tất cả
          </Button>
        </Stack>
      </Box>

      {/* Toolbar cho bulk actions */}
      {selectedProducts.length > 0 && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: 'primary.50' }}>
          <Toolbar sx={{ minHeight: '48px !important', px: '0 !important' }}>
            <Typography variant="body1" sx={{ flex: '1 1 100%' }}>
              Đã chọn {selectedProducts.length} sản phẩm
            </Typography>
            <Tooltip title="Xóa các sản phẩm đã chọn">
              <IconButton
                color="error"
                onClick={() => setBulkDeleteConfirmOpen(true)}
                disabled={isSubmitting}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bỏ chọn tất cả">
              <IconButton
                onClick={() => {
                  setSelectedProducts([]);
                  setSelectAll(false);
                }}
              >
                <ClearAllIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </Paper>
      )}

      {/* Bảng sản phẩm */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={selectedProducts.length > 0 && !selectAll}
                      />
                    </TableCell>
                    <TableCell>Hình ảnh</TableCell>
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>Shop</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Thương hiệu</TableCell>
                    <TableCell>Giá</TableCell>
                    <TableCell>Tồn kho</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow 
                      key={product._id}
                      selected={selectedProducts.includes(product._id)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleSelectProduct(product._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar
                          variant="rounded"
                          sx={{ width: 60, height: 60 }}
                        >
                          <ImageWithFallback
                            src={product.images?.[0] || ''}
                            alt={product.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box 
                            sx={{ 
                              width: 8, 
                              height: 8, 
                              bgcolor: product.shop?.status === 'approved' ? 'success.main' : 'warning.main',
                              borderRadius: '50%',
                              flexShrink: 0
                            }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {product.shop?.shopName || product.shopId?.shopName || 'Shop không xác định'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.shop?.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.categoryName} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={product.brandName} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500" color="primary.main">
                          {formatPriceToVND(product.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {product.stockQuantity || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(product)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(product._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Phân trang và điều khiển */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={pagination.limit}
              onChange={handleLimitChange}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Tổng: {pagination.total} sản phẩm
          </Typography>
        </Box>
        
        <Pagination
          count={pagination.totalPages}
          page={pagination.page}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
      />

      {/* Import Dialog */}
      <Dialog
        open={isImportDialogOpen}
        onClose={handleImportDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import sản phẩm từ file</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Vui lòng ánh xạ các cột trong file với các trường dữ liệu:
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.keys(columnMapping).map((field) => (
              <Grid item xs={12} sm={6} key={field}>
                <FormControl fullWidth size="small">
                  <InputLabel>{field === 'name' ? 'Tên sản phẩm *' : 
                    field === 'description' ? 'Mô tả' :
                    field === 'price' ? 'Giá *' :
                    field === 'stockQuantity' ? 'Tồn kho' :
                    field === 'category' ? 'Danh mục' :
                    field === 'brand' ? 'Thương hiệu' :
                    field === 'image' ? 'Ảnh' : field}</InputLabel>
                  <Select
                    value={columnMapping[field]}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                    label={field}
                  >
                    <MenuItem value="">-- Không chọn --</MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>

          {/* Sample Data Preview */}
          {sampleData.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Xem trước dữ liệu (5 dòng đầu):
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {fileHeaders.map((header) => (
                        <TableCell key={header}>{header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sampleData.map((row, index) => (
                      <TableRow key={index}>
                        {fileHeaders.map((header) => (
                          <TableCell key={header}>{row[header]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleImportWithMapping} 
            variant="contained"
            disabled={!columnMapping.name || isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Results Dialog */}
      <Dialog
        open={isResultsDialogOpen}
        onClose={handleResultsDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Kết quả Import</DialogTitle>
        <DialogContent>
          {importResults && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Tổng số dòng: {importResults.total || (importResults.success || 0) + (importResults.failed || 0)}
              </Typography>
              <Typography variant="body1" color="success.main" gutterBottom>
                Thành công: {importResults.success || 0}
              </Typography>
              <Typography variant="body1" color="error.main" gutterBottom>
                Thất bại: {importResults.failed || 0}
              </Typography>
              
              {importResults.errors && importResults.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Chi tiết lỗi:
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {importResults.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={error}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResultsDialogClose} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={isFormOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleFormSubmit}
        initialValues={editingProduct}
        isSubmitting={isSubmitting}
        categories={categories}
        brands={brands}
      />

      {/* Confirm Delete Single Product Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
        loading={isSubmitting}
      />

      {/* Confirm Bulk Delete Dialog */}
      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="Xóa nhiều sản phẩm"
        message={`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn? Hành động này không thể hoàn tác.`}
        loading={isSubmitting}
      />

      {/* Confirm Delete All Products Dialog */}
      <ConfirmDialog
        open={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        onConfirm={handleDeleteAllProducts}
        title="Xóa tất cả sản phẩm"
        message="Bạn có chắc chắn muốn xóa TẤT CẢ sản phẩm? Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu sản phẩm."
        loading={isSubmitting}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminProductManagement;
