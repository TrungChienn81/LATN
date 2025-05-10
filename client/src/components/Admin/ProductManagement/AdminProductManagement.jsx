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
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ProductList from './ProductList';
import ProductFormDialog from './ProductFormDialog';
import api from '../../../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ImageWithFallback from '../../common/ImageWithFallback';

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
  
  // State cho phân trang
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
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

  // Hàm fetch sản phẩm với phân trang
  const fetchProducts = async () => {
    try {
      const { page, limit } = pagination;
      const response = await api.get(`/products?page=${page}&limit=${limit}`);
      if (response.data && response.data.success) {
        // Cập nhật thông tin phân trang
        setPagination({
          ...pagination,
          total: response.data.total,
          totalPages: response.data.totalPages,
          page: response.data.currentPage
        });
        
        // Map các danh mục và thương hiệu từ ID sang tên để hiển thị
        const productsWithNames = response.data.data.map(product => {
          try {
            // Tìm danh mục dựa trên ID
            const category = categories.find(cat => cat._id === product.category);
            // Tìm thương hiệu dựa trên ID
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
        console.log('Fetched products with category/brand names:', productsWithNames);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setSnackbar({
        open: true,
        message: 'Không thể tải danh sách sản phẩm.',
        severity: 'error'
      });
    }
  };

  // Fetch categories, brands và products khi component mount hoặc refreshKey thay đổi
  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      try {
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
        
        // Sau khi có categories và brands thì fetch products
        // Để có thể map tên danh mục và thương hiệu cho chính xác
      } catch (error) {
        console.error('Error fetching categories and brands:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải danh mục và thương hiệu. Một số tính năng có thể bị hạn chế.',
          severity: 'warning'
        });
      }
    };
    
    fetchCategoriesAndBrands().then(() => {
      fetchProducts(); // Fetch products sau khi có categories và brands
    });
  }, [refreshKey]); // refreshKey thay đổi sẽ gọi lại useEffect này

  // Utility function to find category by name
  const findCategoryByName = (categoryName) => {
    if (!categoryName || !categories.length) return null;
    
    // Tìm theo tên chính xác
    const exactMatch = categories.find(
      cat => cat.name && cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (exactMatch) return exactMatch._id;
    
    // Tìm theo tên gần đúng (contains)
    const partialMatch = categories.find(
      cat => cat.name && cat.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    if (partialMatch) return partialMatch._id;
    
    return null;
  };
  
  // Utility function to find brand by name
  const findBrandByName = (brandName) => {
    if (!brandName || !brands.length) return null;
    
    // Tìm theo tên chính xác
    const exactMatch = brands.find(
      brand => brand.name && brand.name.toLowerCase() === brandName.toLowerCase()
    );
    if (exactMatch) return exactMatch._id;
    
    // Tìm theo tên gần đúng (contains)
    const partialMatch = brands.find(
      brand => brand.name && brand.name.toLowerCase().includes(brandName.toLowerCase())
    );
    if (partialMatch) return partialMatch._id;
    
    return null;
  };
  
  // Xử lý khi nhấn nút chỉnh sửa sản phẩm
  const handleEdit = (product) => {
    // Chuyển đổi các trường dữ liệu nếu cần
    const editableProduct = {
      ...product,
      // Chuyển đổi giá từ triệu sang VND để hiển thị trong form
      price: product.price ? product.price * 1000000 : 0,
      // Đảm bảo category hiển thị đúng
      category: product.categoryName || '',
      // Đảm bảo brand hiển thị đúng
      brand: product.brandName || ''
    };
    console.log('Editing product:', editableProduct);
    setEditingProduct(editableProduct);
    setIsFormOpen(true);
  };
  
  // Xử lý khi nhấn nút xóa sản phẩm
  const handleDelete = async (productId) => {
    try {
      const response = await api.delete(`/products/${productId}`);
      if (response.data && response.data.success) {
        setSnackbar({
          open: true,
          message: 'Xóa sản phẩm thành công!',
          severity: 'success'
        });
        // Cập nhật lại danh sách sản phẩm
        setRefreshKey(prev => prev + 1);
      } else {
        throw new Error(response.data?.message || 'Lỗi khi xóa sản phẩm');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Lỗi khi xóa sản phẩm',
        severity: 'error'
      });
    }
  };

  // Xử lý xóa tất cả sản phẩm
  const handleDeleteAllProducts = async () => {
    try {
      const response = await api.delete('/products/delete-all');
      if (response.data && response.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message || `Đã xóa tất cả sản phẩm thành công!`,
          severity: 'success'
        });
        // Đóng dialog xác nhận
        setDeleteAllConfirmOpen(false);
        // Refresh product list
        setRefreshKey(prev => prev + 1);
      } else {
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting all products:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Lỗi khi xóa tất cả sản phẩm',
        severity: 'error'
      });
      // Đóng dialog xác nhận
      setDeleteAllConfirmOpen(false);
    }
  };

  const handleOpenFormDialog = (product = null) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseFormDialog = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = async (formData, images) => {
    setIsSubmitting(true);
    try {
      // Kiểm tra xem có file ảnh mới không
      const hasImageFiles = images && images.length > 0;
      // Extract other form data
      const { existingImages, ...otherFormData } = formData;
      
      let response;
      
      if (hasImageFiles) {
        // Sử dụng FormData nếu có file ảnh mới
        const formDataObj = new FormData();
        
        // Thêm các trường dữ liệu từ formData (otherFormData) vào FormData
        // TRỪ TRƯỜNG 'images' vì chúng ta sẽ xử lý file riêng
        Object.keys(otherFormData).forEach(key => {
          if (key !== 'images' && otherFormData[key] !== undefined && otherFormData[key] !== null) {
            if (key === 'shopId' && typeof otherFormData[key] === 'object' && otherFormData[key]._id) {
              formDataObj.append(key, otherFormData[key]._id); // Gửi ID của shop
            } else {
              formDataObj.append(key, otherFormData[key]);
            }
          }
        });
        
        // Thêm ảnh đã tồn tại (nếu có và không phải là file mới)
        if (existingImages && existingImages.length > 0) {
          existingImages.forEach((url) => {
            // Chỉ thêm nếu nó là một URL, không phải là đối tượng File còn sót lại từ logic cũ
            if (typeof url === 'string') {
              formDataObj.append('existingImages', url); // Sử dụng key khác cho ảnh cũ nếu cần phân biệt rõ ràng hơn ở backend
            }
          });
        }
        
        // Thêm các file ảnh mới vào FormData với key 'images'
        images.forEach(file => {
          if (file instanceof File) { // Đảm bảo đó thực sự là một File object
            formDataObj.append('images', file);
          }
        });
        
        console.log('Sending product data with images');
        for (let [key, value] of formDataObj.entries()) {
          console.log(`${key}: ${value instanceof File ? value.name : value}`);
        }
        
        // QUAN TRỌNG: KHÔNG đặt header 'Content-Type' khi gửi FormData
        // Axios sẽ tự động đặt đúng header với boundary
        
        if (editingProduct && editingProduct._id) {
          response = await api.put(`/products/${editingProduct._id}`, formDataObj);
        } else {
          response = await api.post('/products', formDataObj);
        }
      } else {
        // Sử dụng JSON nếu không có file ảnh mới
        const finalData = { ...otherFormData };

        // Đảm bảo shopId là ID nếu nó là object
        if (finalData.shopId && typeof finalData.shopId === 'object' && finalData.shopId._id) {
          finalData.shopId = finalData.shopId._id;
        }

        // Bao gồm ảnh đã tồn tại (nếu có) - lọc các đối tượng không hợp lệ
        if (existingImages && existingImages.length > 0) {
          finalData.images = existingImages.filter(img => typeof img === 'string' && img.trim() !== '');
        } else {
          // Nếu không có existingImages và cũng không có file mới, đảm bảo images là mảng rỗng
          finalData.images = []; 
        }
        
        console.log('Sending product data as JSON:', finalData);
        
        if (editingProduct && editingProduct._id) {
          response = await api.put(
            `/products/${editingProduct._id}`, 
            finalData
          );
        } else {
          response = await api.post('/products', finalData);
        }
      }
      
      // Xử lý response dựa trên cấu trúc { status: 'success', data: { product: ... } }
      // hoặc cấu trúc cũ { success: true, ... }
      if ((response.data && response.data.success) || 
          (response.data && response.data.status === 'success')) {
        setSnackbar({
          open: true,
          message: editingProduct 
            ? 'Cập nhật sản phẩm thành công!' 
            : 'Thêm sản phẩm mới thành công!',
          severity: 'success'
        });
        handleCloseFormDialog();
        // Refresh product list
        setRefreshKey(prev => prev + 1);
      } else {
        throw new Error(response.data?.message || response.data?.data?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu sản phẩm',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
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
              setFileHeaders(results.meta.fields || []);
              setSampleData(results.data.slice(0, 5));
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
              mappedRow.image = row[column];
            }
            // Các trường khác
            else {
              mappedRow[field] = row[column];
            }
          }
        });

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
          failures: response.data.failures || []
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
  return (
    <Box sx={{ width: '100%' }}>
      {/* Bảng hiển thị sản phẩm */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" component="div">
            Quản lý Sản phẩm
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              startIcon={<AddIcon />}
              sx={{ mr: 1 }}
            >
              Thêm Sản phẩm mới
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => fileInputRef.current.click()}
              startIcon={<FileUploadIcon />}
              sx={{ mr: 1 }}
            >
              Import từ File
              <input
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteAllConfirmOpen(true)}
              startIcon={<DeleteSweepIcon />}
            >
              Xóa tất cả sản phẩm
            </Button>
          </Box>
        </Box>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="Products table">
            <TableHead>
              <TableRow>
                <TableCell>Ảnh</TableCell>
                <TableCell>Tên Sản phẩm</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell>Giá</TableCell>
                <TableCell>Tồn kho</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <ImageWithFallback
                      src={product.images && product.images.length > 0 ? product.images[0] : ''}
                      alt={product.name}
                      sx={{
                        height: 50,
                        width: 50,
                        border: '1px solid #eee',
                        bgcolor: '#f5f5f5',
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.categoryName || 'Không xác định'}</TableCell>
                  <TableCell>{product.price ? `${(product.price * 1000000).toLocaleString()} ₫` : 'N/A'}</TableCell>
                  <TableCell>{product.stockQuantity}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(product)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(product._id)} size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Phân trang */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', p: 2 }}>
          <Pagination 
            count={pagination.totalPages} 
            page={pagination.page} 
            onChange={(event, newPage) => {
              setPagination({ ...pagination, page: newPage });
            }}
            color="primary"
            showFirstButton 
            showLastButton
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hiển thị {products.length} / {pagination.total} sản phẩm
          </Typography>
        </Box>
      </Paper>

      {/* Import Mapping Dialog */}
      <Dialog 
        open={isImportDialogOpen} 
        onClose={handleImportDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Nhập sản phẩm từ file</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Cấu hình ánh xạ cột
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Chọn cột nào từ file tương ứng với từng trường dữ liệu trong hệ thống
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Field mapping */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="name-column-label">Tên sản phẩm</InputLabel>
                  <Select
                    labelId="name-column-label"
                    value={columnMapping.name}
                    onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                    label="Tên sản phẩm"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="proloop-name-column-label">proloop-name</InputLabel>
                  <Select
                    labelId="proloop-name-column-label"
                    value={columnMapping.proloopName}
                    onChange={(e) => setColumnMapping({ ...columnMapping, proloopName: e.target.value })}
                    label="proloop-name"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="description-column-label">Mô tả</InputLabel>
                  <Select
                    labelId="description-column-label"
                    value={columnMapping.description}
                    onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                    label="Mô tả"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="price-column-label">Giá</InputLabel>
                  <Select
                    labelId="price-column-label"
                    value={columnMapping.price}
                    onChange={(e) => setColumnMapping({ ...columnMapping, price: e.target.value })}
                    label="Giá"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="proloop-price-compare-column-label">proloop-price--compare</InputLabel>
                  <Select
                    labelId="proloop-price-compare-column-label"
                    value={columnMapping.proloopPriceCompare}
                    onChange={(e) => setColumnMapping({ ...columnMapping, proloopPriceCompare: e.target.value })}
                    label="proloop-price--compare"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="proloop-price-highlight-column-label">proloop-price--highlight</InputLabel>
                  <Select
                    labelId="proloop-price-highlight-column-label"
                    value={columnMapping.proloopPriceHighlight}
                    onChange={(e) => setColumnMapping({ ...columnMapping, proloopPriceHighlight: e.target.value })}
                    label="proloop-price--highlight"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="stockQuantity-column-label">Số lượng</InputLabel>
                  <Select
                    labelId="stockQuantity-column-label"
                    value={columnMapping.stockQuantity}
                    onChange={(e) => setColumnMapping({ ...columnMapping, stockQuantity: e.target.value })}
                    label="Số lượng"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="category-column-label">Danh mục</InputLabel>
                  <Select
                    labelId="category-column-label"
                    value={columnMapping.category}
                    onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                    label="Danh mục"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="brand-column-label">Thương hiệu</InputLabel>
                  <Select
                    labelId="brand-column-label"
                    value={columnMapping.brand}
                    onChange={(e) => setColumnMapping({ ...columnMapping, brand: e.target.value })}
                    label="Thương hiệu"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="image-column-label">URL Ảnh</InputLabel>
                  <Select
                    labelId="image-column-label"
                    value={columnMapping.image}
                    onChange={(e) => setColumnMapping({ ...columnMapping, image: e.target.value })}
                    label="URL Ảnh"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="img-default-src-column-label">img-default src</InputLabel>
                  <Select
                    labelId="img-default-src-column-label"
                    value={columnMapping.imgDefaultSrc}
                    onChange={(e) => setColumnMapping({ ...columnMapping, imgDefaultSrc: e.target.value })}
                    label="img-default src"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="href-column-label">href</InputLabel>
                  <Select
                    labelId="href-column-label"
                    value={columnMapping.href}
                    onChange={(e) => setColumnMapping({ ...columnMapping, href: e.target.value })}
                    label="href"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="aspect-ratio-column-label">aspect-ratio</InputLabel>
                  <Select
                    labelId="aspect-ratio-column-label"
                    value={columnMapping.aspectRatio}
                    onChange={(e) => setColumnMapping({ ...columnMapping, aspectRatio: e.target.value })}
                    label="aspect-ratio"
                  >
                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                    {fileHeaders.map((header) => (
                      <MenuItem key={header} value={header}>{header}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom>
              Xem trước dữ liệu
            </Typography>
            {sampleData.length > 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
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
                          <TableCell key={`${index}-${header}`}>
                            {row[header] || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose} color="inherit">
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImportWithMapping}
            disabled={!columnMapping.name} // Yêu cầu ít nhất phải có tên sản phẩm
          >
            Tiếp tục Import
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Import Results Dialog */}
      <Dialog 
        open={isResultsDialogOpen} 
        onClose={handleResultsDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Kết quả nhập sản phẩm</DialogTitle>
        <DialogContent>
          {importResults && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tổng kết
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Paper sx={{ p: 2, flex: 1, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="h6">{importResults.success || 0}</Typography>
                  <Typography variant="body2">Sản phẩm thành công</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="h6">{importResults.failed || 0}</Typography>
                  <Typography variant="body2">Sản phẩm thất bại</Typography>
                </Paper>
              </Stack>
              
              {importResults.failures && importResults.failures.length > 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Chi tiết lỗi
                  </Typography>
                  <List>
                    {importResults.failures.map((failure, index) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={`Dòng ${failure.row}: ${failure.productName || 'Không có tên'}`}
                            secondary={failure.error || 'Lỗi không xác định'}
                          />
                        </ListItem>
                        {index < importResults.failures.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </>
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
      
      {/* Snackbar thông báo */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog xác nhận xóa sản phẩm */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Hủy</Button>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              handleDelete(deletingProductId);
            }} 
            color="error" 
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog xác nhận xóa tất cả sản phẩm */}
      <Dialog
        open={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
      >
        <DialogTitle>Xóa tất cả sản phẩm</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>Cảnh báo:</strong> Bạn sắp xóa tất cả sản phẩm trong hệ thống!
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: 'error.main' }}>
            Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả sản phẩm. 
            Bạn có chắc chắn muốn tiếp tục không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllConfirmOpen(false)} autoFocus>
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteAllProducts} 
            color="error" 
            variant="contained"
          >
            Xóa tất cả sản phẩm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProductManagement;
