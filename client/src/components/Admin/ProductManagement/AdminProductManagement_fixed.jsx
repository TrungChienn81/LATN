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
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ProductList from './ProductList';
import ProductFormDialog from './ProductFormDialog';
import api from '../../../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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
    image: ''
  });
  const [sampleData, setSampleData] = useState([]);

  // State for results dialog
  const [importResults, setImportResults] = useState(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  // Hàm fetch sản phẩm
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      if (response.data && response.data.success) {
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
    // Hiển thị hộp thoại xác nhận trước khi xóa
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
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
        
        // Thêm các trường dữ liệu từ formData vào FormData
        Object.keys(otherFormData).forEach(key => {
          if (otherFormData[key] !== undefined && otherFormData[key] !== null) {
            formDataObj.append(key, otherFormData[key]);
          }
        });
        
        // Thêm ảnh đã tồn tại (nếu có)
        if (existingImages && existingImages.length > 0) {
          existingImages.forEach((url, index) => {
            formDataObj.append('existingImages', url);
          });
        }
        
        // Thêm các file ảnh mới vào FormData
        images.forEach(file => {
          formDataObj.append('images', file);
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
        
        // Bao gồm ảnh đã tồn tại (nếu có) - lọc các đối tượng không hợp lệ
        if (existingImages && existingImages.length > 0) {
          // Đảm bảo chỉ sử dụng các chuỗi URL hợp lệ, loại bỏ các đối tượng trống hoặc không phải chuỗi
          finalData.images = existingImages.filter(img => typeof img === 'string' && img.trim() !== '');
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
      
      if (response.data && response.data.success) {
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
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
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
      image: ''
    });
    setSampleData([]);
  };

  // Xử lý khi đóng dialog kết quả import
  const handleResultsDialogClose = () => {
    setIsResultsDialogOpen(false);
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
                    {product.images && product.images.length > 0 ? (
                      <Box
                        component="img"
                        sx={{
                          height: 50,
                          width: 50,
                          objectFit: 'contain',
                          border: '1px solid #eee'
                        }}
                        alt={product.name}
                        src={product.images[0].startsWith('http') ? product.images[0] : `${window.location.origin}${product.images[0]}`}
                        onError={(e) => {
                          // Xử lý khi ảnh không tải được
                          e.target.src = 'https://placeholder.pics/svg/50x50/DEDEDE/555555/no%20image';
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 50,
                          width: 50,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#f5f5f5',
                          color: '#999',
                          fontSize: '12px',
                          border: '1px solid #eee'
                        }}
                      >
                        No image
                      </Box>
                    )}
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
              {Object.keys(columnMapping).map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`${field}-label`}>{field}</InputLabel>
                    <Select
                      labelId={`${field}-label`}
                      value={columnMapping[field]}
                      label={field}
                      onChange={(e) => setColumnMapping({
                        ...columnMapping,
                        [field]: e.target.value
                      })}
                    >
                      <MenuItem value="">
                        <em>Không chọn</em>
                      </MenuItem>
                      {fileHeaders.map((header) => (
                        <MenuItem value={header} key={header}>
                          {header}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
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
            onClick={() => {
              // Thực hiện import dữ liệu
              console.log('Importing with mapping:', columnMapping);
              // handleImportWithMapping(); // Hàm xử lý import với mapping
            }}
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
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminProductManagement;
