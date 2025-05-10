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
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
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

  // Fetch categories and brands on component mount
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
  }, []);

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

  const handleOpenFormDialog = (product = null) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseFormDialog = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      let response;
      if (editingProduct && editingProduct._id) {
        response = await api.put(`/products/${editingProduct._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await api.post('/products', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (response.data && response.data.success) {
        setSnackbar({ 
          open: true, 
          message: editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm mới thành công!', 
          severity: 'success' 
        });
        setRefreshKey(k => k + 1);
        handleCloseFormDialog();
      } else {
        throw new Error(response.data.message || 'Thao tác thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error("Error submitting product form:", err);
      let errorMessage = 'Đã có lỗi xảy ra trong quá trình xử lý.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleImportButtonClick = () => {
    fileInputRef.current.click();
  };

  // New functions for import mapping
  const handleShowImportDialog = (parsedData, headers) => {
    setFileData(parsedData);
    setFileHeaders(headers);
    
    // Set sample data for preview
    setSampleData(parsedData.slice(0, 3));
    
    // Try to auto-map common column names
    const newMapping = { ...columnMapping };
    
    headers.forEach(header => {
      const headerLower = header.toLowerCase();
      
      if (headerLower.includes('name') || headerLower.includes('product') || headerLower === 'proloop-name') {
        newMapping.name = header;
      }
      else if (headerLower.includes('desc') || headerLower.includes('mô tả')) {
        newMapping.description = header;
      }
      else if (headerLower.includes('price') || headerLower.includes('giá') || headerLower === 'proloop-price--highlight') {
        newMapping.price = header;
      }
      else if (headerLower.includes('stock') || headerLower.includes('quantity') || headerLower.includes('số lượng') || headerLower === 'count') {
        newMapping.stockQuantity = header;
      }
      else if (headerLower.includes('categ') || headerLower.includes('danh mục')) {
        newMapping.category = header;
      }
      else if (headerLower.includes('brand') || headerLower.includes('thương hiệu')) {
        newMapping.brand = header;
      }
      else if (headerLower.includes('image') || headerLower.includes('img') || headerLower.includes('ảnh') || headerLower === 'img-default src') {
        newMapping.image = header;
      }
    });
    
    setColumnMapping(newMapping);
    setIsImportDialogOpen(true);
  };
  
  const handleImportDialogClose = () => {
    setIsImportDialogOpen(false);
    setFileData(null);
    setFileHeaders([]);
    setSampleData([]);
  };
  
  const handleMappingChange = (field, value) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }));
  };
  
  const handleProcessMappedData = () => {
    if (!fileData) return;
    
    const mappedProducts = fileData.map(item => {
      let descriptionLines = [];
      if (columnMapping.description && item[columnMapping.description]) {
        descriptionLines.push(item[columnMapping.description]);
      }
      
      const stockQuantityString = columnMapping.stockQuantity ? 
        (item[columnMapping.stockQuantity] || '0').toString().replace(/[^\d]/g, '') : '0';
      const stockQuantity = parseInt(stockQuantityString, 10);

      let imageUrls = [];
      if (columnMapping.image && item[columnMapping.image]) {
        let imageUrl = item[columnMapping.image];
        if (imageUrl.startsWith('@')) {
          imageUrl = imageUrl.substring(1);
        }
        imageUrls.push(imageUrl);
      }

      const processPrice = (priceString) => {
        if (!priceString) return 0;
        const clearedPrice = priceString.toString().replace(/[^\d.]/g, '');
        if (parseFloat(clearedPrice) < 1000) {
          return parseFloat(clearedPrice);
        }
        return parseFloat(clearedPrice) / 1000000;
      };

      const price = columnMapping.price ? processPrice(item[columnMapping.price]) : 0;

      // Get category and brand names from the mapped columns
      const categoryName = columnMapping.category ? item[columnMapping.category] : null;
      const categoryId = categoryName ? findCategoryByName(categoryName) : null;
      
      const brandName = columnMapping.brand ? item[columnMapping.brand] : null;
      const brandId = brandName ? findBrandByName(brandName) : null;

      return {
        name: columnMapping.name ? item[columnMapping.name] : `Sản phẩm không tên ${Date.now()}`,
        description: descriptionLines.join('\n'),
        price: isNaN(price) ? 0 : price,
        stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity,
        images: imageUrls,
        category: categoryId,
        categoryName: categoryName,
        brand: brandId,
        brandName: brandName
      };
    }).filter(p => p.name && typeof p.price === 'number' && p.price >= 0);

    console.log("Mapped products:", mappedProducts);

    if (mappedProducts.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Không tìm thấy dữ liệu sản phẩm hợp lệ từ file sau khi mapping. Vui lòng kiểm tra mapping.', 
        severity: 'warning' 
      });
      return;
    }
    
    // Close the mapping dialog
    handleImportDialogClose();
    
    // Call the import API
    handleBulkImportApiCall(mappedProducts);
  };

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file.name, file.type);
      setSnackbar({ open: true, message: `Đang xử lý file: ${file.name}...`, severity: 'info' });

      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              // Instead of direct processing, show the mapping dialog
              handleShowImportDialog(results.data, Object.keys(results.data[0]));
            } else {
              setSnackbar({ open: true, message: 'File CSV rỗng hoặc không có dữ liệu.', severity: 'warning' });
            }
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            setSnackbar({ open: true, message: `Lỗi khi đọc file CSV: ${error.message}`, severity: 'error' });
          }
        });
      } else if (file.type.includes('spreadsheetml.sheet') || file.type.includes('ms-excel') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            
            if (jsonData.length > 1) {
              const headers = jsonData[0].map(h => String(h).trim());
              const rows = jsonData.slice(1).map(rowArray => {
                let rowObject = {};
                headers.forEach((header, index) => {
                  rowObject[header] = rowArray[index];
                });
                return rowObject;
              });
              
              // Instead of direct processing, show the mapping dialog
              handleShowImportDialog(rows, headers);
            } else {
               setSnackbar({ open: true, message: 'File Excel rỗng hoặc chỉ có dòng tiêu đề.', severity: 'warning' });
            }
          } catch (error) {
            console.error("Error parsing XLSX:", error);
            setSnackbar({ open: true, message: `Lỗi khi đọc file Excel: ${error.message}`, severity: 'error' });
          }
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            setSnackbar({ open: true, message: 'Không thể đọc file.', severity: 'error' });
        };
        reader.readAsBinaryString(file);
      } else {
        setSnackbar({ open: true, message: 'Định dạng file không được hỗ trợ. Vui lòng chọn file CSV hoặc Excel.', severity: 'error' });
      }
      event.target.value = null; 
    }
  };

  // Updated handleBulkImportApiCall to show results
  const handleBulkImportApiCall = async (productsToImport) => {
    setSnackbar({ open: true, message: `Đang chuẩn bị import ${productsToImport.length} sản phẩm...`, severity: 'info' });
    setIsSubmitting(true);
    try {
      const response = await api.post('/products/import', { products: productsToImport });
      if (response.data && response.data.success) {
        // Store the results for display
        setImportResults({
          message: response.data.message,
          importedCount: response.data.importedCount,
          failedCount: response.data.failedCount,
          newCategories: response.data.newCategories || [],
          newBrands: response.data.newBrands || [],
          errors: response.data.errors || []
        });
        
        // Show results dialog if there are new categories or brands
        if ((response.data.newCategories && response.data.newCategories.length > 0) || 
            (response.data.newBrands && response.data.newBrands.length > 0)) {
          setIsResultsDialogOpen(true);
        } else {
          // Otherwise just show a snackbar
          setSnackbar({ 
            open: true, 
            message: response.data.message || `Đã import thành công ${response.data.importedCount || productsToImport.length} sản phẩm!`, 
            severity: 'success' 
          });
        }
        
        setRefreshKey(k => k + 1); // Refresh lại danh sách sản phẩm
      } else {
        throw new Error(response.data.message || 'Import thất bại.');
      }
    } catch (err) {
      console.error("Error importing products:", err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || err.message || 'Lỗi khi import sản phẩm.', 
        severity: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseResultsDialog = () => {
    setIsResultsDialogOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Import Mapping Dialog */}
      <Dialog 
        open={isImportDialogOpen} 
        onClose={handleImportDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Thiết lập import sản phẩm
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Vui lòng chọn cột dữ liệu tương ứng với từng trường thông tin sản phẩm:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="name-column-label">Tên sản phẩm *</InputLabel>
                <Select
                  labelId="name-column-label"
                  value={columnMapping.name}
                  label="Tên sản phẩm *"
                  onChange={(e) => handleMappingChange('name', e.target.value)}
                  required
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {fileHeaders.map(header => (
                    <MenuItem key={header} value={header}>{header}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="price-column-label">Giá *</InputLabel>
                <Select
                  labelId="price-column-label"
                  value={columnMapping.price}
                  label="Giá *"
                  onChange={(e) => handleMappingChange('price', e.target.value)}
                  required
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {fileHeaders.map(header => (
                    <MenuItem key={header} value={header}>{header}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="stock-column-label">Số lượng tồn kho</InputLabel>
                <Select
                  labelId="stock-column-label"
                  value={columnMapping.stockQuantity}
                  label="Số lượng tồn kho"
                  onChange={(e) => handleMappingChange('stockQuantity', e.target.value)}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {fileHeaders.map(header => (
                    <MenuItem key={header} value={header}>{header}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="image-column-label">Ảnh sản phẩm</InputLabel>
                <Select
                  labelId="image-column-label"
                  value={columnMapping.image}
                  label="Ảnh sản phẩm"
                  onChange={(e) => handleMappingChange('image', e.target.value)}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {fileHeaders.map(header => (
                    <MenuItem key={header} value={header}>{header}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="desc-column-label">Mô tả</InputLabel>
                <Select
                  labelId="desc-column-label"
                  value={columnMapping.description}
                  label="Mô tả"
                  onChange={(e) => handleMappingChange('description', e.target.value)}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {fileHeaders.map(header => (
                    <MenuItem key={header} value={header}>{header}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="category-column-label">Danh mục</InputLabel>
                <Select
                  labelId="category-column-label"
                  value={columnMapping.category}
                  label="Danh mục"
                  onChange={(e) => handleMappingChange('category', e.target.value)}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {fileHeaders.map(header => (
                    <MenuItem key={header} value={header}>{header}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="brand-column-label">Thương hiệu</InputLabel>
                <Select
                  labelId="brand-column-label"
                  value={columnMapping.brand}
                  label="Thương hiệu"
                  onChange={(e) => handleMappingChange('brand', e.target.value)}
                >
                  <MenuItem value=""><em>Không chọn</em></MenuItem>
                  {fileHeaders.map(header => (
                    <MenuItem key={header} value={header}>{header}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {sampleData.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Xem trước dữ liệu (3 dòng đầu tiên):
              </Typography>
              <Box sx={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', p: 1 }}>
                {sampleData.map((row, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, borderBottom: '1px solid #eee' }}>
                    <Typography variant="body2">
                      <strong>Tên:</strong> {columnMapping.name ? row[columnMapping.name] : 'N/A'}<br />
                      <strong>Giá:</strong> {columnMapping.price ? row[columnMapping.price] : 'N/A'}<br />
                      <strong>Danh mục:</strong> {columnMapping.category ? row[columnMapping.category] : 'N/A'}<br />
                      <strong>Thương hiệu:</strong> {columnMapping.brand ? row[columnMapping.brand] : 'N/A'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose}>Hủy</Button>
          <Button
            onClick={handleProcessMappedData}
            variant="contained"
            disabled={!columnMapping.name || !columnMapping.price}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Results Dialog */}
      <Dialog
        open={isResultsDialogOpen}
        onClose={handleCloseResultsDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Kết quả Import Sản phẩm</DialogTitle>
        <DialogContent>
          {importResults && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {importResults.message}
              </Typography>
              
              <Box sx={{ my: 2, display: 'flex', gap: 2 }}>
                <Chip 
                  label={`Đã import: ${importResults.importedCount} sản phẩm`} 
                  color="success" 
                  variant="outlined"
                />
                {importResults.failedCount > 0 && (
                  <Chip 
                    label={`Lỗi: ${importResults.failedCount} sản phẩm`} 
                    color="error" 
                    variant="outlined"
                  />
                )}
              </Box>
              
              {importResults.newCategories && importResults.newCategories.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Danh mục mới được tạo:
                  </Typography>
                  <List dense sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    {importResults.newCategories.map((category, index) => (
                      <React.Fragment key={category.id || index}>
                        <ListItem>
                          <ListItemText 
                            primary={category.name} 
                            secondary={`ID: ${category.id}`}
                          />
                        </ListItem>
                        {index < importResults.newCategories.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
              
              {importResults.newBrands && importResults.newBrands.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Thương hiệu mới được tạo:
                  </Typography>
                  <List dense sx={{ bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    {importResults.newBrands.map((brand, index) => (
                      <React.Fragment key={brand.id || index}>
                        <ListItem>
                          <ListItemText 
                            primary={brand.name} 
                            secondary={`ID: ${brand.id}`}
                          />
                        </ListItem>
                        {index < importResults.newBrands.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}
              
              {importResults.errors && importResults.errors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'error.main' }}>
                    Lỗi khi import:
                  </Typography>
                  <List dense sx={{ bgcolor: 'error.lightest', border: '1px solid #ffcccc', borderRadius: 1 }}>
                    {importResults.errors.slice(0, 5).map((error, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText 
                            primary={error.error} 
                            secondary={error.item?.name || 'Sản phẩm không tên'}
                          />
                        </ListItem>
                        {index < Math.min(importResults.errors.length, 5) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                    {importResults.errors.length > 5 && (
                      <ListItem>
                        <ListItemText 
                          primary={`...và ${importResults.errors.length - 5} lỗi khác`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultsDialog} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom component="div" sx={{ mb: 0 }}>
          Quản lý Sản phẩm
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleImportButtonClick}
            disabled={isSubmitting}
          >
            Import từ File
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenFormDialog()} 
            disabled={isSubmitting}
          >
            Thêm Sản phẩm mới
          </Button>
        </Stack>
      </Box>
      
      <input 
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      />

      <ProductList
        onEditProduct={handleOpenFormDialog} 
        refreshCounter={refreshKey} 
      />

      {isFormOpen && (
        <ProductFormDialog
          open={isFormOpen}
          onClose={handleCloseFormDialog}
          onSubmit={handleFormSubmit}
          initialData={editingProduct}
          isSubmitting={isSubmitting}
        />
      )}
      
      <Snackbar
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminProductManagement; 