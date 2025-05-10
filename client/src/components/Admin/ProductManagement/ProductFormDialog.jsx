import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress, 
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CancelIcon from '@mui/icons-material/Cancel';
import ImageWithFallback from '../../common/ImageWithFallback';

const ProductFormDialog = ({ 
  open, 
  onClose, 
  isEditMode, 
  onSubmit, 
  initialValues, 
  isSubmitting, 
  categories = [], 
  brands = [] 
}) => {
  const [formData, setFormData] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      console.log('Initial values:', initialValues);
      const updatedInitialValues = {
        ...initialValues,
        price: typeof initialValues.price === 'number' ? initialValues.price * 1000000 : '',
        // Xử lý danh mục
        category: initialValues.category?.name || 
                 (categories.find(c => c._id === initialValues.category)?.name) || 
                 initialValues.category || '',
        // Xử lý thương hiệu
        brand: initialValues.brand?.name || 
              (brands.find(b => b._id === initialValues.brand)?.name) || 
              initialValues.brand || '',
      };
      console.log('Updated form data:', updatedInitialValues);
      setFormData(updatedInitialValues);

      // Xử lý ảnh sản phẩm
      if (initialValues.images && Array.isArray(initialValues.images)) {
        const previews = initialValues.images.map((img) => ({ 
          url: typeof img === 'string' ? img : img.url || '', 
          file: null 
        }));
        console.log('Image previews:', previews);
        setImagePreviews(previews);
      } else {
        setImagePreviews([]);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stockQuantity: 0,
        category: '',
        brand: '',
      });
      setImagePreviews([]);
    }
    setErrors({}); 
  }, [initialValues, open, categories, brands]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    // Tạo bản sao của mảng hiện tại
    const newPreviews = [...imagePreviews];
    
    // Thêm các file mới vào previews
    Array.from(files).forEach((file) => {
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          images: `Ảnh ${file.name} vượt quá kích thước tối đa (5MB)` 
        }));
        return;
      }
      
      // Đọc file ảnh
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({ url: reader.result, file });
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (image, index) => {
    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate các trường bắt buộc
    if (!formData.name || !formData.description || !formData.price || !formData.stockQuantity || !formData.category) {
      setErrors({
        name: !formData.name ? 'Tên Sản phẩm là bắt buộc' : '',
        description: !formData.description ? 'Mô tả sản phẩm là bắt buộc' : '',
        price: !formData.price ? 'Giá sản phẩm là bắt buộc' : '',
        stockQuantity: !formData.stockQuantity ? 'Số lượng tồn kho là bắt buộc' : '',
        category: !formData.category ? 'Danh mục là bắt buộc' : '',
      });
      return;
    }
    
    try {
      // Chuẩn bị dữ liệu để gửi
      const clonedFormData = {...formData};
      
      // Chuyển đổi giá từ VND sang triệu VND nếu cần
      if (clonedFormData.price && typeof clonedFormData.price !== 'undefined') {
        const priceValue = typeof clonedFormData.price === 'string' 
          ? parseFloat(clonedFormData.price.replace(/[^0-9.-]+/g, '')) 
          : parseFloat(clonedFormData.price);
          
        if (!isNaN(priceValue)) {
          // Nếu giá trị là hàng triệu VND (ví dụ: 21.950.000), chia cho 1.000.000
          if (priceValue > 1000) {
            clonedFormData.price = priceValue / 1000000;
          } else {
            // Nếu đã là triệu (ví dụ: 21.95) thì giữ nguyên
            clonedFormData.price = priceValue;
          }
        }
      }
      
      // Xử lý ảnh
      const imageFiles = [];
      
      // Đảm bảo existingImages là một mảng
      clonedFormData.existingImages = [];
      
      // Lọc các ảnh mới có file (chưa được tải lên trước đó)
      imagePreviews.forEach(preview => {
        // Kiểm tra đầy đủ điều kiện của preview
        if (!preview || typeof preview !== 'object') return;
        
        // ƯU TIÊN: Nếu có preview.file, đó là file mới cần upload
        if (preview.file) {
          imageFiles.push(preview.file);
        } else if (preview.url && (preview.url.startsWith('/uploads/') || preview.url.startsWith('http'))) {
          // Chỉ khi không có preview.file, mới xét đến URL của ảnh đã tồn tại
          clonedFormData.existingImages.push(preview.url);
        }
      });
      
      // Đảm bảo không có giá trị undefined hoặc null trong mảng
      clonedFormData.existingImages = clonedFormData.existingImages.filter(url => url && typeof url === 'string');
      
      console.log('Submitting with data:', clonedFormData);
      console.log('New image files:', imageFiles);
      console.log('Existing images:', clonedFormData.existingImages || []);
      
      // Gọi hàm onSubmit (handleFormSubmit từ AdminProductManagement)
      onSubmit(clonedFormData, imageFiles);
    } catch (error) {
      console.error('Error in form submission:', error);
      // Hiển thị lỗi nếu có
      setErrors(prevErrors => ({
        ...prevErrors,
        form: 'Có lỗi xảy ra khi gửi form: ' + error.message
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{isEditMode ? 'Chỉnh sửa Sản phẩm' : 'Chỉnh sửa Sản phẩm'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <TextField
                name="name"
                label="Tên Sản phẩm"
                value={formData.name || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required
                error={Boolean(errors.name)}
                helperText={errors.name}
              />
              <TextField
                name="description"
                label="Mô tả sản phẩm"
                value={formData.description || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <TextField
                name="price"
                label="Giá (VND)"
                type="number"
                value={formData.price || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required
                InputProps={{ inputProps: { min: 0 } }}
                error={Boolean(errors.price)}
                helperText={errors.price || 'Nhập giá sản phẩm (đơn vị: đồng, ví dụ: 23000000)'}
              />
              <TextField
                name="stockQuantity"
                label="Số lượng tồn kho"
                type="number"
                value={formData.stockQuantity || 0}
                onChange={handleChange}
                fullWidth
                margin="dense"
                InputProps={{ inputProps: { min: 0 } }}
                error={Boolean(errors.stockQuantity)}
                helperText={errors.stockQuantity}
              />
              <TextField
                name="category"
                label="Danh mục"
                value={formData.category || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required
                error={Boolean(errors.category)}
                helperText={errors.category || 'Nhập tên danh mục sản phẩm'}
                InputProps={{
                  endAdornment: categories.length > 0 && (
                    <Button 
                      size="small" 
                      onClick={(e) => {
                        e.preventDefault();
                        // Hiển thị danh sách gợi ý nếu cần
                      }}
                    >
                      Gợi ý
                    </Button>
                  ),
                }}
              />

              <TextField
                name="brand"
                label="Thương hiệu"
                value={formData.brand || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                error={Boolean(errors.brand)}
                helperText={errors.brand || 'Nhập tên thương hiệu sản phẩm (không bắt buộc)'}
                InputProps={{
                  endAdornment: brands.length > 0 && (
                    <Button 
                      size="small" 
                      onClick={(e) => {
                        e.preventDefault();
                        // Hiển thị danh sách gợi ý nếu cần
                      }}
                    >
                      Gợi ý
                    </Button>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>Hình ảnh sản phẩm</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', mb: 2 }}>
                {imagePreviews.map((image, index) => (
                  <Box key={index} sx={{ position: 'relative', border: '1px dashed grey', padding: '5px', borderRadius: '4px' }}>
                    <ImageWithFallback
                      src={image.url}
                      alt={`preview ${index}`}
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        borderRadius: 1
                      }}
                    />
                    <IconButton 
                      size="small"
                      onClick={() => handleRemoveImage(image, index)}
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        '&:hover': { backgroundColor: 'white' }
                      }}
                    >
                      <CancelIcon fontSize="small" color="error"/>
                    </IconButton>
                  </Box>
                ))}
                {imagePreviews.length < 5 && (
                  <Button 
                    variant="outlined" 
                    component="label" 
                    startIcon={<AddPhotoAlternateIcon />} 
                    sx={{ height: 112, width: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
                  >
                    Thêm ảnh
                    <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button type="submit" variant="contained" > 
            {isEditMode ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductFormDialog; 