import React, { useState, useCallback, useRef } from 'react';
import {
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
  Stack
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

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file.name, file.type);
      setSnackbar({ open: true, message: `Đang xử lý file: ${file.name}...`, severity: 'info' });

      const processData = (parsedData) => {
        console.log("Raw parsedData from file:", parsedData);

        const mappedProducts = parsedData.map(item => {
          let descriptionLines = [];
          if (item['proloop-technical--line']) descriptionLines.push(item['proloop-technical--line']);
          if (item['proloop-technical--line 2']) descriptionLines.push(item['proloop-technical--line 2']);
          if (item['proloop-technical--line 3']) descriptionLines.push(item['proloop-technical--line 3']);
          if (item['proloop-technical--line 4']) descriptionLines.push(item['proloop-technical--line 4']);
          if (item['proloop-technical--line 5']) descriptionLines.push(item['proloop-technical--line 5']);
          if (item['proloop-technical--line 6']) descriptionLines.push(item['proloop-technical--line 6']);
          
          const priceHighlightString = (item['proloop-price--highlight'] || '0').toString().replace(/[^\d.]/g, '');
          const price = parseFloat(priceHighlightString);

          const priceCompareString = (item['proloop-price--compare'] || '0').toString().replace(/[^\d.]/g, '');
          const compareAtPrice = parseFloat(priceCompareString);

          const stockQuantityString = (item['count'] || '0').toString().replace(/[^\d]/g, '');
          const stockQuantity = parseInt(stockQuantityString, 10);

          let imageUrls = [];
          if (item['img-default src']) {
            imageUrls.push({ url: item['img-default src'] }); 
          }

          return {
            name: item['proloop-name'],
            description: descriptionLines.join('\n'),
            price: isNaN(price) ? 0 : price,
            compareAtPrice: (isNaN(compareAtPrice) || compareAtPrice <= price) ? undefined : compareAtPrice,
            stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity,
            images: imageUrls, 
            // Vẫn cần cột CategoryID và BrandID trong file nếu muốn import tự động
            // category: item['CategoryID'], 
            // brand: item['BrandID'],
          };
        }).filter(p => p.name && typeof p.price === 'number' && p.price >= 0);

        console.log("Mapped products:", mappedProducts);

        if (mappedProducts.length === 0) {
          setSnackbar({ open: true, message: 'Không tìm thấy dữ liệu sản phẩm hợp lệ trong file. Vui lòng kiểm tra tên cột và nội dung file.', severity: 'warning' });
          return;
        }
        handleBulkImportApiCall(mappedProducts);
      };

      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              processData(results.data);
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
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }); // header:1 để lấy mảng, defval để tránh null
            
            if (jsonData.length > 1) { // jsonData[0] là headers
              const headers = jsonData[0].map(h => String(h).trim()); // Convert header to string and trim
              const rows = jsonData.slice(1).map(rowArray => {
                let rowObject = {};
                headers.forEach((header, index) => {
                  rowObject[header] = rowArray[index];
                });
                return rowObject;
              });
              processData(rows);
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

  // Hàm này bạn sẽ cần tạo để gọi API import hàng loạt
  const handleBulkImportApiCall = async (productsToImport) => {
    setSnackbar({ open: true, message: `Đang chuẩn bị import ${productsToImport.length} sản phẩm...`, severity: 'info' });
    setIsSubmitting(true); // Có thể dùng isSubmitting hoặc tạo state mới isImporting
    try {
      // Giả sử API endpoint của bạn là /api/products/import và nhận một mảng sản phẩm
      const response = await api.post('/products/import', { products: productsToImport });
      if (response.data && response.data.success) {
        setSnackbar({ 
          open: true, 
          message: response.data.message || `Đã import thành công ${response.data.importedCount || productsToImport.length} sản phẩm!`, 
          severity: 'success' 
        });
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

  return (
    <Box sx={{ width: '100%' }}>
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