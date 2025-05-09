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
  CircularProgress, // For loading categories/brands
  Box,
  Typography,
  Chip,
  IconButton,
  Avatar
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../../services/api'; // Assuming you have this for API calls

const ProductFormDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]); // Assuming you might have brands
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const isEditMode = Boolean(initialData && initialData._id);

  // Fetch categories and brands
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingCategories(true);
      setLoadingBrands(true);
      try {
        const [catResponse, brandResponse] = await Promise.all([
          api.get('/categories'), // Replace with your actual categories endpoint
          api.get('/brands')      // Replace with your actual brands endpoint
        ]);
        if (catResponse.data && catResponse.data.success) {
          setCategories(catResponse.data.data || []);
        }
        if (brandResponse.data && brandResponse.data.success) {
          setBrands(brandResponse.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching categories/brands:", error);
        // Handle error (e.g., show a snackbar message)
      } finally {
        setLoadingCategories(false);
        setLoadingBrands(false);
      }
    };
    if (open) {
        fetchDropdownData();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          price: initialData.price || '',
          category: initialData.category?._id || initialData.category || '',
          brand: initialData.brand?._id || initialData.brand || '',
          stockQuantity: initialData.stockQuantity || 0,
          // existing images might be handled differently, not as new file uploads
        });
        // Populate image previews from existing images if any
        if (initialData.images && initialData.images.length > 0) {
          setImagePreviews(initialData.images.map(img => ({ ...img, isExisting: true })));
        }
        setSelectedFiles([]); // Clear any newly selected files if re-opening in edit mode
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          brand: '',
          stockQuantity: 0,
        });
        setSelectedFiles([]);
        setImagePreviews([]);
      }
      setErrors({});
    }
  }, [open, initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    // Basic validation (e.g., max number of files, file type, size)
    if (selectedFiles.length + files.length > 5) { // Example: max 5 images
        alert('Bạn chỉ có thể tải lên tối đa 5 ảnh.');
        return;
    }

    const newFiles = files.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newFiles.map(f => ({ url: f.preview, name: f.name, isNew: true }))]);
  };

  const handleRemoveImage = (imageToRemove, index) => {
    if (imageToRemove.isNew) { // Removing a newly selected file
        setSelectedFiles(prev => prev.filter((file, i) => file.preview !== imageToRemove.url));
        setImagePreviews(prev => prev.filter((img, i) => img.url !== imageToRemove.url));
        // Revoke object URL to free up memory
        URL.revokeObjectURL(imageToRemove.url);
    } else if (imageToRemove.isExisting) { // Marking an existing image for deletion
        // This requires backend logic to handle deletion.
        // For now, we'll just remove it from preview and add to a potential `deletedImages` list.
        setImagePreviews(prev => prev.filter((img, i) => i !== index));
        // You might want to add imageToRemove._id to a separate state array like `imagesToDelete`
        // to send this info to the backend upon form submission.
        setFormData(prev => ({
            ...prev,
            imagesToDelete: [...(prev.imagesToDelete || []), imageToRemove.public_id || imageToRemove._id]
        }));
    }
  };


  const validate = () => {
    let tempErrors = {};
    if (!formData.name) tempErrors.name = 'Tên sản phẩm là bắt buộc.';
    if (!formData.price || formData.price <= 0) tempErrors.price = 'Giá sản phẩm phải lớn hơn 0.';
    if (!formData.category) tempErrors.category = 'Danh mục là bắt buộc.';
    if (formData.stockQuantity < 0) tempErrors.stockQuantity = 'Số lượng tồn kho không thể âm.';
    // Add more validations as needed (e.g., description length)
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // For file uploads, you'll typically use FormData
      const submissionData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'imagesToDelete') {
            // Send array of image IDs/public_ids to delete
            (formData.imagesToDelete || []).forEach(imgId => {
                submissionData.append('imagesToDelete[]', imgId);
            });
        } else {
            submissionData.append(key, formData[key]);
        }
      });
      selectedFiles.forEach(file => {
        submissionData.append('images', file); // 'images' should match your backend field name
      });
      onSubmit(submissionData); 
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{isEditMode ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Left Column: Basic Info */}
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

            {/* Right Column: Pricing, Stock, Categories */}
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
                helperText={errors.price}
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
              <FormControl fullWidth margin="dense" required error={Boolean(errors.category)}>
                <InputLabel>Danh mục</InputLabel>
                {loadingCategories ? <CircularProgress size={20} /> : (
                  <Select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleChange}
                    label="Danh mục"
                  >
                    <MenuItem value=""><em>Chọn danh mục</em></MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                )}
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Thương hiệu (Tùy chọn)</InputLabel>
                {loadingBrands ? <CircularProgress size={20} /> : (
                  <Select
                    name="brand"
                    value={formData.brand || ''}
                    onChange={handleChange}
                    label="Thương hiệu (Tùy chọn)"
                  >
                    <MenuItem value=""><em>Chọn thương hiệu</em></MenuItem>
                    {brands.map((brand) => (
                      <MenuItem key={brand._id} value={brand._id}>{brand.name}</MenuItem>
                    ))}
                  </Select>
                )}
              </FormControl>
            </Grid>

            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{mt: 1}}>Hình ảnh sản phẩm</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', mb: 2 }}>
                {imagePreviews.map((image, index) => (
                  <Box key={index} sx={{ position: 'relative', border: '1px dashed grey', padding: '5px', borderRadius: '4px' }}>
                    <Avatar 
                        src={image.url} 
                        alt={`preview ${index}`} 
                        variant="rounded" 
                        sx={{ width: 100, height: 100 }}
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
                        sx={{height: 112, width: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}
                    >
                        Thêm ảnh
                        <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                    </Button>
                )}
              </Box>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px:3, pb: 2}}>
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button type="submit" variant="contained" > {/* Add disabled={loadingSubmission} if you have such state */}
            {isEditMode ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductFormDialog; 