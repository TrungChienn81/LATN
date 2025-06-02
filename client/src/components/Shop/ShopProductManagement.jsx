import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import ProductFormDialog from '../Admin/ProductManagement/ProductFormDialog';
import api from '../../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { formatPriceToVND, convertVNDToMillions } from '../../utils/formatters';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

const ShopProductManagement = () => {
  const { user } = useAuth();
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
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: '',
    brand: '',
    image: '',
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

  // Hàm fetch sản phẩm của shop với phân trang
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const response = await api.get(`/shops/my-shop/products?page=${page}&limit=${limit}`);
      if (response.data && response.data.success) {
        // Cập nhật thông tin phân trang
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages,
          page: response.data.currentPage
        }));
        
        // Map các danh mục và thương hiệu từ ID sang tên để hiển thị
        const productsWithNames = response.data.data.map(product => {
          try {
            const category = categories.find(cat => cat._id === product.category);
            const brand = brands.find(b => b._id === product.brand);
            
            return {
              ...product,
              categoryName: category ? category.name : 'Không xác định',
              brandName: brand ? brand.name : 'Không xác định'
            };
          } catch (mappingError) {
            console.warn('Lỗi khi xử lý sản phẩm:', mappingError, 'Product:', product);
            return {
              ...product,
              categoryName: 'Không xác định',
              brandName: 'Không xác định'
            };
          }
        });
        
        setProducts(productsWithNames);
        console.log('Fetched shop products:', productsWithNames);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
      setSnackbar({
        open: true,
        message: 'Không thể tải danh sách sản phẩm của shop.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories, brands và products khi component mount hoặc refreshKey thay đổi
  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      try {
        console.log('=== USER DEBUG INFO ===');
        console.log('Current user from context:', {
          id: user?._id,
          username: user?.username,
          email: user?.email,
          role: user?.role,
          shopId: user?.shopId
        });
        
        // Fetch shop info
        try {
          const shopResponse = await api.get('/shops/my-shop');
          console.log('User shop info:', shopResponse.data.data);
        } catch (shopError) {
          console.log('Shop fetch error:', shopError.response?.data);
        }
        
        // Fetch categories
        const categoriesResponse = await api.get('/categories');
        if (categoriesResponse.data && categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data || []);
        }
        
        // Fetch brands
        const brandsResponse = await api.get('/brands');
        if (brandsResponse.data && brandsResponse.data.success) {
          setBrands(brandsResponse.data.data || []);
        }
        
        // Reset selections when refreshing
        setSelectedProducts([]);
        setSelectAll(false);
      } catch (error) {
        console.error('Error fetching categories and brands:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải danh mục và thương hiệu.',
          severity: 'warning'
        });
      }
    };
    
    fetchCategoriesAndBrands().then(() => {
      fetchProducts();
    });
  }, [refreshKey]);

  // Fetch products khi trang thay đổi
  useEffect(() => {
    if (categories.length > 0 && brands.length > 0) {
      fetchProducts();
      setSelectedProducts([]);
      setSelectAll(false);
    }
  }, [pagination.page]);

  // Hàm xử lý thay đổi trang
  const handlePageChange = (event, value) => {
    setPagination(prev => ({
      ...prev,
      page: value
    }));
  };

  // Hàm xử lý thay đổi số sản phẩm trên mỗi trang
  const handleLimitChange = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: event.target.value,
      page: 1
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
      console.log('Starting bulk delete for products:', selectedProducts);
      
      for (let i = 0; i < selectedProducts.length; i++) {
        const productId = selectedProducts[i];
        console.log(`Bulk deleting product ${i + 1}/${selectedProducts.length}: ${productId}`);
        
        try {
          await api.delete(`/products/${productId}`);
          console.log(`Successfully bulk deleted product: ${productId}`);
        } catch (deleteError) {
          console.error(`Failed to bulk delete product ${productId}:`, deleteError);
          throw deleteError;
        }
      }
      
      console.log('Bulk delete completed successfully');
      
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
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      setSnackbar({
        open: true,
        message: `Có lỗi xảy ra khi xóa sản phẩm: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (productId) => {
    setDeletingProductId(productId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      console.log('Deleting single product:', deletingProductId);
      
      await api.delete(`/products/${deletingProductId}`);
      console.log('Successfully deleted single product');
      
      setSnackbar({
        open: true,
        message: 'Sản phẩm đã được xóa thành công.',
        severity: 'success'
      });
      
      setDeleteConfirmOpen(false);
      setDeletingProductId(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting single product:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      setSnackbar({
        open: true,
        message: `Có lỗi xảy ra khi xóa sản phẩm: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa tất cả sản phẩm của shop
  const handleDeleteAllProducts = async () => {
    try {
      setIsSubmitting(true);
      console.log('Starting delete all products for shop...');
      
      // Gọi API để lấy tất cả sản phẩm của shop trước
      console.log('Fetching all shop products...');
      const response = await api.get('/shops/my-shop/products?limit=1000'); // Lấy tất cả
      console.log('Shop products response:', response.data);
      
      const shopProducts = response.data.data || [];
      
      if (shopProducts.length === 0) {
        setSnackbar({
          open: true,
          message: 'Không có sản phẩm nào để xóa.',
          severity: 'info'
        });
        setDeleteAllConfirmOpen(false);
        return;
      }
      
      console.log(`Found ${shopProducts.length} products to delete`);
      
      // Xóa từng sản phẩm một
      for (let i = 0; i < shopProducts.length; i++) {
        const product = shopProducts[i];
        console.log(`Deleting product ${i + 1}/${shopProducts.length}: ${product.name} (ID: ${product._id})`);
        
        try {
          await api.delete(`/products/${product._id}`);
          console.log(`Successfully deleted product: ${product.name}`);
        } catch (deleteError) {
          console.error(`Failed to delete product ${product.name}:`, deleteError);
          throw deleteError; // Re-throw để outer catch handle
        }
      }
      
      console.log('All products deleted successfully');
      
      setSnackbar({
        open: true,
        message: `Đã xóa thành công ${shopProducts.length} sản phẩm của shop.`,
        severity: 'success'
      });
      
      setDeleteAllConfirmOpen(false);
      setSelectedProducts([]);
      setSelectAll(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting all shop products:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      setSnackbar({
        open: true,
        message: `Có lỗi xảy ra khi xóa sản phẩm: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (formData, images) => {
    try {
      setIsSubmitting(true);
      
      console.log('=== PRODUCT SUBMIT DEBUG ===');
      console.log('Edit mode:', !!editingProduct);
      console.log('Form data received:', formData);
      console.log('Images received:', images);
      console.log('Editing product:', editingProduct);
      
      const productData = new FormData();
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('price', formData.price);
      productData.append('stockQuantity', formData.stockQuantity || 0);
      productData.append('category', formData.category);
      productData.append('brand', formData.brand);

      // Append existing images if any
      if (formData.existingImages && formData.existingImages.length > 0) {
        console.log('Appending existing images:', formData.existingImages);
        formData.existingImages.forEach(imageUrl => {
          productData.append('existingImages', imageUrl);
        });
      }

      // Append new image files
      console.log('Appending new images:', images?.length || 0);
      images.forEach((image, index) => {
        productData.append('images', image);
      });

      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of productData.entries()) {
        console.log(key, ':', value);
      }

      let response;
      if (editingProduct) {
        console.log(`Making PUT request to: /products/${editingProduct._id}`);
        response = await api.put(`/products/${editingProduct._id}`, productData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        console.log('Making POST request to: /shops/my-shop/products');
        response = await api.post('/shops/my-shop/products', productData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      console.log('Response received:', response.data);

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!',
          severity: 'success'
        });
        setRefreshKey(prev => prev + 1);
        setIsFormOpen(false);
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý file upload cho CSV/Excel import
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
              setupColumnMapping(headers);
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
            
            if (jsonData && jsonData.length > 1) {
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
              setupColumnMapping(headers);
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

  // Auto-detect columns by name
  const setupColumnMapping = (headers) => {
    const initialMapping = {
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      brand: '',
      image: ''
    };

    headers.forEach(header => {
      const headerStr = String(header).toLowerCase();
      
      if (headerStr.includes('tên') || headerStr.includes('name')) {
        initialMapping.name = header;
      } else if (headerStr.includes('mô tả') || headerStr.includes('description')) {
        initialMapping.description = header;
      } else if (headerStr.includes('giá') || headerStr.includes('price')) {
        initialMapping.price = header;
      } else if (headerStr.includes('số lượng') || headerStr.includes('stock')) {
        initialMapping.stockQuantity = header;
      } else if (headerStr.includes('danh mục') || headerStr.includes('category')) {
        initialMapping.category = header;
      } else if (headerStr.includes('thương hiệu') || headerStr.includes('brand')) {
        initialMapping.brand = header;
      } else if (headerStr.includes('ảnh') || headerStr.includes('image')) {
        initialMapping.image = header;
      }
    });

    console.log("Auto-mapped columns:", initialMapping);
    setColumnMapping(initialMapping);
  };

  // Xử lý import dữ liệu
  const handleImportData = async () => {
    if (!fileData || fileData.length === 0) {
      setSnackbar({
        open: true,
        message: 'Không có dữ liệu để import',
        severity: 'error'
      });
      return;
    }

    // Check required mappings
    if (!columnMapping.name) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn cột cho tên sản phẩm',
        severity: 'error'
      });
      return;
    }

    // Debug: Log column mapping and sample data
    console.log('=== IMPORT DEBUG INFO ===');
    console.log('Column Mapping:', columnMapping);
    console.log('File Headers:', fileHeaders);
    console.log('Sample Data (first 3 rows):', fileData.slice(0, 3));
    console.log('Total rows to import:', fileData.length);
    console.log('=========================');

    try {
      setIsSubmitting(true);
      const results = {
        total: fileData.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < fileData.length; i++) {
        try {
          const row = fileData[i];
          
          // Validate required fields first
          const name = row[columnMapping.name]?.toString().trim() || '';
          const priceStr = row[columnMapping.price]?.toString().trim() || '';
          
          if (!name) {
            results.failed++;
            results.errors.push(`Dòng ${i + 1}: Thiếu tên sản phẩm`);
            continue;
          }
          
          if (!priceStr) {
            results.failed++;
            results.errors.push(`Dòng ${i + 1}: Thiếu giá sản phẩm`);
            continue;
          }
          
          // Handle price - remove Vietnamese currency symbols and convert
          let price = 0;
          const cleanPriceStr = priceStr.replace(/[^\d.,]/g, ''); // Remove non-numeric chars except . and ,
          if (cleanPriceStr.includes('đ') || priceStr.includes('VND')) {
            // If price is in VND, convert to millions
            price = parseFloat(cleanPriceStr.replace(/[.,]/g, '')) / 1000000;
          } else {
            price = parseFloat(cleanPriceStr.replace(/,/g, ''));
          }
          
          if (isNaN(price) || price <= 0) {
            results.failed++;
            results.errors.push(`Dòng ${i + 1}: Giá sản phẩm không hợp lệ (${priceStr})`);
            continue;
          }
          
          // Build description - either from mapped column or from technical lines
          let description = '';
          if (columnMapping.description && row[columnMapping.description]) {
            description = row[columnMapping.description].toString().trim();
          } else {
            // Build description from technical lines (proloop format)
            const technicalLines = [];
            for (let j = 1; j <= 6; j++) {
              const lineKey = j === 1 ? 'proloop-technical--line' : `proloop-technical--line ${j}`;
              if (row[lineKey]) {
                technicalLines.push(row[lineKey].toString().trim());
              }
            }
            description = technicalLines.join(', ') || 'Sản phẩm chất lượng cao';
          }
          
          // Create FormData for each product (server expects FormData)
          const productData = new FormData();
          productData.append('name', name);
          productData.append('description', description);
          productData.append('price', price.toString());
          productData.append('stockQuantity', (parseInt(row[columnMapping.stockQuantity]) || 10).toString());
          productData.append('category', row[columnMapping.category]?.toString().trim() || 'General');
          productData.append('brand', row[columnMapping.brand]?.toString().trim() || 'Unknown');
          
          // Handle image URL if provided - send as existing image
          if (columnMapping.image && row[columnMapping.image]) {
            const imageUrl = row[columnMapping.image]?.toString().trim();
            if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('https'))) {
              productData.append('existingImages', imageUrl);
            }
          }

          // Debug log
          console.log(`Importing product ${i + 1}:`, {
            name,
            description: description.substring(0, 50) + '...',
            originalPrice: priceStr,
            convertedPrice: price,
            stockQuantity: parseInt(row[columnMapping.stockQuantity]) || 10,
            category: row[columnMapping.category]?.toString().trim() || 'General',
            brand: row[columnMapping.brand]?.toString().trim() || 'Unknown'
          });

          await api.post('/shops/my-shop/products', productData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          results.success++;
          
        } catch (error) {
          console.error(`Error importing row ${i + 1}:`, error);
          results.failed++;
          const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
          results.errors.push(`Dòng ${i + 1}: ${errorMsg}`);
        }
      }

      setImportResults(results);
      setIsImportDialogOpen(false);
      setIsResultsDialogOpen(true);
      setRefreshKey(prev => prev + 1);

      setSnackbar({
        open: true,
        message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
        severity: results.success > 0 ? 'success' : 'warning'
      });
    } catch (error) {
      console.error('Import error:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi import dữ liệu',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      image: ''
    });
    setSampleData([]);
  };

  const handleResultsDialogClose = () => {
    setIsResultsDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header với các nút thao tác */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Quản lý sản phẩm Shop
        </Typography>
        <Stack direction="row" spacing={2}>
          {user?.role === 'customer' && (
            <Button
              variant="outlined"
              color="warning"
              onClick={async () => {
                try {
                  console.log('Calling fix-role endpoint...');
                  const response = await api.post('/shops/fix-role');
                  console.log('Fix role response:', response.data);
                  setSnackbar({
                    open: true,
                    message: 'Đã cập nhật role thành Seller. Bạn vẫn có thể mua sản phẩm như trước!',
                    severity: 'success'
                  });
                  // Refresh trang sau 3 giây
                  setTimeout(() => window.location.reload(), 3000);
                } catch (error) {
                  console.error('Fix role error:', error);
                  setSnackbar({
                    open: true,
                    message: 'Lỗi khi cập nhật role: ' + (error.response?.data?.message || error.message),
                    severity: 'error'
                  });
                }
              }}
              sx={{ textTransform: 'none' }}
            >
              Kích hoạt quyền Seller
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsFormOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Thêm sản phẩm
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
                  {products.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
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
            onClick={handleImportData} 
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
                Tổng số dòng: {importResults.total}
              </Typography>
              <Typography variant="body1" color="success.main" gutterBottom>
                Thành công: {importResults.success}
              </Typography>
              <Typography variant="body1" color="error.main" gutterBottom>
                Thất bại: {importResults.failed}
              </Typography>
              
              {importResults.errors.length > 0 && (
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
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
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
        title="Xóa tất cả sản phẩm của shop"
        message="Bạn có chắc chắn muốn xóa TẤT CẢ sản phẩm của shop? Hành động này không thể hoàn tác và sẽ xóa toàn bộ sản phẩm trong shop của bạn."
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

export default ShopProductManagement; 