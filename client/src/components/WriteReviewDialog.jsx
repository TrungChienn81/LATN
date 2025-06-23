import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Typography,
  Box,
  Stack,
  Alert,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  Star
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

const WriteReviewDialog = ({ 
  open, 
  onClose, 
  onSubmit, 
  product,
  existingReview = null // For editing
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [content, setContent] = useState(existingReview?.content || '');
  const [images, setImages] = useState(existingReview?.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!existingReview;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }
    
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        productId: product._id,
        rating,
        title: title.trim(),
        content: content.trim(),
        images
      });
      
      // Reset form
      if (!isEditing) {
        setRating(0);
        setTitle('');
        setContent('');
        setImages([]);
      }
      
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleImageRemove = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (!isEditing) {
      setRating(0);
      setTitle('');
      setContent('');
      setImages([]);
    }
    setError('');
    onClose();
  };

  const ratingLabels = {
    1: 'Rất tệ',
    2: 'Tệ', 
    3: 'Bình thường',
    4: 'Tốt',
    5: 'Tuyệt vời'
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Star color="primary" />
          <Typography variant="h6">
            {isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá sản phẩm'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Product Info */}
        <Box display="flex" gap={2} mb={3} p={2} bgcolor="grey.50" borderRadius={2}>
          <img
            src={product?.images?.[0] || '/placeholder.jpg'}
            alt={product?.name}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {product?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {product?.brand} • {product?.category}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Rating */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Đánh giá của bạn *
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Rating
                value={rating}
                onChange={(event, newValue) => setRating(newValue)}
                size="large"
                precision={1}
              />
              {rating > 0 && (
                <Typography variant="body2" color="primary" fontWeight="bold">
                  {ratingLabels[rating]}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Title */}
          <TextField
            label="Tiêu đề đánh giá (tùy chọn)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            placeholder="Ví dụ: Sản phẩm chất lượng tốt"
            inputProps={{ maxLength: 100 }}
            helperText={`${title.length}/100 ký tự`}
          />

          {/* Content */}
          <TextField
            label="Nội dung đánh giá *"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            inputProps={{ maxLength: 1000 }}
            helperText={`${content.length}/1000 ký tự`}
          />

          {/* Images */}
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Thêm hình ảnh (tùy chọn)
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <label htmlFor="review-image-upload">
                <Input
                  accept="image/*"
                  id="review-image-upload"
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  disabled={images.length >= 5}
                >
                  Chọn ảnh
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">
                Tối đa 5 ảnh, mỗi ảnh dưới 5MB
              </Typography>
            </Stack>

            {images.length > 0 && (
              <ImageList cols={Math.min(images.length, 3)} gap={8} sx={{ maxHeight: 200 }}>
                {images.map((image, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={image}
                      alt={`Review ${index + 1}`}
                      loading="lazy"
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                    <ImageListItemBar
                      actionIcon={
                        <IconButton
                          sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                          onClick={() => handleImageRemove(index)}
                        >
                          <Delete />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || rating === 0 || !content.trim()}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Đang gửi...' : (isEditing ? 'Cập nhật' : 'Gửi đánh giá')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WriteReviewDialog; 