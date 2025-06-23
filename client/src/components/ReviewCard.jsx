import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Avatar,
  Chip,
  Button,
  Stack,
  Divider,
  IconButton,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  DialogTitle
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  VerifiedUser,
  Reply,
  Edit,
  Delete,
  PhotoLibrary
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const ReviewCard = ({ 
  review, 
  currentUser, 
  onVote, 
  onReply, 
  onEdit, 
  onDelete,
  showShopReply = true 
}) => {
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const handleVote = (isHelpful) => {
    if (onVote) {
      onVote(review._id, isHelpful);
    }
  };

  const handleReply = () => {
    if (onReply && replyContent.trim()) {
      onReply(review._id, replyContent.trim());
      setReplyContent('');
      setReplyDialogOpen(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const isOwner = currentUser && currentUser.id === review.userId._id;
  const isShopOwner = currentUser && currentUser.shopId === review.shopId._id;
  const canReply = isShopOwner && !review.shopReply?.content;

  return (
    <>
      <Card sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent>
          {/* User Info & Rating */}
          <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
            <Avatar 
              src={review.userId.avatar} 
              alt={review.userId.name}
              sx={{ width: 48, height: 48 }}
            >
              {review.userId.name?.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {review.userId.name}
                </Typography>
                {review.isVerifiedPurchase && (
                  <Chip 
                    icon={<VerifiedUser />}
                    label="Đã mua hàng"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {formatDistanceToNow(new Date(review.createdAt), { 
                    addSuffix: true, 
                    locale: vi 
                  })}
                </Typography>
              </Box>
            </Box>

            {/* Action buttons for owner */}
            {isOwner && (
              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={() => onEdit?.(review)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => onDelete?.(review._id)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            )}
          </Box>

          {/* Review Title */}
          {review.title && (
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>
              {review.title}
            </Typography>
          )}

          {/* Review Content */}
          <Typography variant="body1" mb={2} sx={{ lineHeight: 1.6 }}>
            {review.content}
          </Typography>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <Box mb={2}>
              <ImageList cols={Math.min(review.images.length, 4)} gap={8} sx={{ maxHeight: 200 }}>
                {review.images.map((image, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={image}
                      alt={`Review ${index + 1}`}
                      loading="lazy"
                      style={{ 
                        cursor: 'pointer',
                        borderRadius: 8,
                        objectFit: 'cover'
                      }}
                      onClick={() => handleImageClick(image)}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {/* Shop Reply */}
          {showShopReply && review.shopReply?.content && (
            <Box 
              sx={{ 
                mt: 2,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                borderLeft: 4,
                borderColor: 'primary.main'
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Reply fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                  Phản hồi từ shop
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {formatDistanceToNow(new Date(review.shopReply.repliedAt), { 
                    addSuffix: true, 
                    locale: vi 
                  })}
                </Typography>
              </Box>
              <Typography variant="body2">
                {review.shopReply.content}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Actions */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              {/* Helpful votes */}
              <Button
                startIcon={<ThumbUp />}
                size="small"
                variant={review.userVote === true ? "contained" : "outlined"}
                color="primary"
                onClick={() => handleVote(true)}
                disabled={!currentUser}
              >
                Hữu ích ({review.helpfulCount || 0})
              </Button>
              
              <Button
                startIcon={<ThumbDown />}
                size="small"
                variant={review.userVote === false ? "contained" : "outlined"}
                color="error"
                onClick={() => handleVote(false)}
                disabled={!currentUser}
              >
                Không hữu ích ({review.unhelpfulCount || 0})
              </Button>
            </Stack>

            {/* Reply button for shop owner */}
            {canReply && (
              <Button
                startIcon={<Reply />}
                size="small"
                variant="outlined"
                onClick={() => setReplyDialogOpen(true)}
              >
                Phản hồi
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Phản hồi đánh giá</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Nhập phản hồi của bạn..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleReply}
            variant="contained"
            disabled={!replyContent.trim()}
          >
            Gửi phản hồi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <img
            src={selectedImage}
            alt="Review"
            style={{ width: '100%', height: 'auto', borderRadius: 8 }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewCard; 