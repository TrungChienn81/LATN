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
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Close as CloseIcon } from '@mui/icons-material';
import { convertVNDToMillions } from '../../../utils/formatters';

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: 0,
    category: '',
    brand: '',
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});

  // Determine if we're in edit mode based on initialValues
  const isEditing = Boolean(initialValues && initialValues._id);
  
  useEffect(() => {
    console.log('ProductFormDialog opened with: ', { 
      isEditing: Boolean(initialValues && initialValues._id),
      initialValues 
    });
  
    if (initialValues) {
      console.log('Initial values:', initialValues);
      const updatedInitialValues = {
        ...initialValues,
        // Keep price in VND for display
        price: typeof initialValues.price === 'number' 
          ? (initialValues.price * 1000000).toString()
          : '',
        // Handle category
        category: initialValues.category?.name || 
                 (categories.find(c => c._id === initialValues.category)?.name) || 
                 initialValues.category || '',
        // Handle brand
        brand: initialValues.brand?.name || 
              (brands.find(b => b._id === initialValues.brand)?.name) || 
              initialValues.brand || '',
      };
      console.log('Updated form data:', updatedInitialValues);
      setFormData(updatedInitialValues);

      // Handle product images
      if (initialValues.images && Array.isArray(initialValues.images)) {
        console.log('Product has images:', initialValues.images);
        const previews = initialValues.images.map((img, index) => {
          const imgUrl = typeof img === 'string' ? img : img.url || '';
          console.log(`Processing image ${index + 1}:`, imgUrl);
          return { url: imgUrl, file: null };
        });
        console.log('Image previews created:', previews);
        setImagePreviews(previews);
      } else {
        console.log('No images found in product or images is not an array:', initialValues.images);
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
  }, [initialValues, open]);

  // Separate useEffect to update category/brand names khi categories/brands change
  useEffect(() => {
    if (initialValues && initialValues._id && categories.length > 0 && brands.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: initialValues.category?.name || 
                 (categories.find(c => c._id === initialValues.category)?.name) || 
                 initialValues.category || prev.category,
        brand: initialValues.brand?.name || 
              (brands.find(b => b._id === initialValues.brand)?.name) || 
              initialValues.brand || prev.brand,
      }));
    }
  }, [categories, brands, initialValues?._id]); // Chỉ update khi categories/brands thay đổi

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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
    // Validate required fields
    if (!formData.name || !formData.description || !formData.price || !formData.stockQuantity || !formData.category) {
      setErrors({
        name: !formData.name ? 'Tên sản phẩm là bắt buộc' : '',
        description: !formData.description ? 'Mô tả sản phẩm là bắt buộc' : '',
        price: !formData.price ? 'Giá sản phẩm là bắt buộc' : '',
        stockQuantity: !formData.stockQuantity ? 'Số lượng tồn kho là bắt buộc' : '',
        category: !formData.category ? 'Danh mục là bắt buộc' : '',
      });
      return;
    }

    try {
      console.log('Starting form submission...');
      
      // Prepare form data
      const clonedFormData = {...formData};
      console.log('Current image previews:', imagePreviews);
      
      // Convert price from VND to millions
      if (clonedFormData.price) {
        clonedFormData.price = convertVNDToMillions(clonedFormData.price);
      }

      // Handle images
      const imageFiles = [];
      clonedFormData.existingImages = [];
      
      console.log('Processing images for submission...');
      
      // Process image previews
      for (const preview of imagePreviews) {
        if (preview.file) {
          imageFiles.push(preview.file);
        } else if (preview.url) {
          clonedFormData.existingImages.push(preview.url);
        }
      }
      
      // Create FormData if there are new images
      const submitData = new FormData();
      
      // Append basic product data
      Object.keys(clonedFormData).forEach(key => {
        if (key !== 'images' && clonedFormData[key] !== undefined) {
          submitData.append(key, clonedFormData[key]);
        }
      });
      
      // Append new images
      imageFiles.forEach(file => {
        submitData.append('images', file);
      });
      
      // Append existing image URLs
      if (clonedFormData.existingImages.length > 0) {
        submitData.append('existingImages', JSON.stringify(clonedFormData.existingImages));
      }
      
      console.log('Submitting form data:', clonedFormData);
      await onSubmit(clonedFormData, imageFiles);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {initialValues ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
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
                error={Boolean(errors.description)}
                helperText={errors.description}
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
                InputProps={{ 
                  inputProps: { min: 0 },
                  endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>VND</Typography>
                }}
                error={Boolean(errors.price)}
                helperText={errors.price || 'Nhập giá sản phẩm (VND)'}
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
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {isEditing ? 'Ảnh hiện tại của sản phẩm:' : 'Thêm ảnh cho sản phẩm:'}
                </Typography>
              </Box>
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
                    {imagePreviews.length > 0 ? 'Thêm ảnh' : 'Chọn ảnh'}
                    <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}> 
            {initialValues && initialValues._id ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            {isSubmitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductFormDialog; 